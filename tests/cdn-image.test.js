"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const Hexo = require("hexo");

const {
    getCdnImageConfig,
    validateCdnImageConfig,
} = require("../scripts/utils/cdn-image-config.js");
const { findPostBodyImages } = require("../scripts/utils/cdn-image-assets.js");
const {
    diffManifest,
    readManifest,
    writeManifestAtomically,
} = require("../scripts/utils/cdn-image-manifest.js");
const runCdnCommand = require("../scripts/console/lib/cdn-image.js");
const { rewriteCdnImageHtml } = require("../scripts/filters/lib/cdn-image.js");
const { base64url, createQiniuProvider } = require("../scripts/utils/cdn-image-qiniu.js");

const themeDir = path.resolve(__dirname, "..");
const hostDir = process.env.HEXO_HOST_DIR;

function write(target, content) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
}

function createFixture(t) {
    assert.ok(hostDir, "HEXO_HOST_DIR must point to the Hexo host");
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-cdn-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");
    write(path.join(fixtureDir, "_config.yml"), [
        "title: CDN fixture",
        "url: https://example.test",
        "root: /",
        "theme: hexo-theme-doratiger",
        "permalink: posts/:title/",
        "post_asset_folder: true",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "cdn_image:",
        "  enable: true",
        "  provider: qiniu",
        "  public_base_url: https://cdn.example.test",
        "  key_prefix: images",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "demo.md"), [
        "---",
        "title: Demo",
        "date: 2026-09-05 00:00:00",
        "---",
        "![asset](diagram.png?raw=1#top)",
        "![reference asset][diagram-reference]",
        "<img src=\"/images/site-photo.webp\">",
        "<img src=\"https://example.com/external.png\">",
        "<picture><source srcset=\"diagram.png 1x, diagram@2x.png 2x\"></picture>",
        "",
        "[diagram-reference]: diagram-reference.png \"reference image\"",
    ].join("\n") + "\n");
    fs.mkdirSync(path.join(fixtureDir, "source", "_posts", "demo"), { recursive: true });
    fs.writeFileSync(path.join(fixtureDir, "source", "_posts", "demo", "diagram.png"), "diagram");
    fs.writeFileSync(path.join(fixtureDir, "source", "_posts", "demo", "diagram@2x.png"), "diagram-2x");
    fs.writeFileSync(path.join(fixtureDir, "source", "_posts", "demo", "diagram-reference.png"), "diagram-reference");
    write(path.join(fixtureDir, "source", "images", "site-photo.webp"), "site-photo");
    write(path.join(fixtureDir, "source", "images", "unused.png"), "unused");
    return fixtureDir;
}

test("cdn image configuration defaults to disabled with an images key prefix", () => {
    const config = getCdnImageConfig({
        base_dir: "/site/",
        doratiger: { config: {} },
    });

    assert.equal(config.enabled, false);
    assert.equal(config.fallbackEnabled, false);
    assert.equal(config.keyPrefix, "images");
    assert.equal(
        config.manifestPath,
        "/site/plugins/cdn_image/.hexo-cdn-image-manifest.json"
    );
    assert.equal(config.qiniu.accessKey, "");
    assert.equal(config.qiniu.secretKey, "");
});

test("credential validation redacts configured secret values", () => {
    const result = validateCdnImageConfig(
        {
            enabled: true,
            provider: "qiniu",
            publicBaseUrl: "https://cdn.example.test",
            keyPrefix: "images",
            manifestPath: "/site/plugins/cdn_image/.hexo-cdn-image-manifest.json",
            qiniu: {
                bucket: "test-bucket",
                region: "z0",
                accessKey: "test-access-key",
                secretKey: "secret-that-must-not-appear",
            },
        },
        { requireCredentials: true }
    );

    assert.equal(result.ok, true);
    assert.equal(JSON.stringify(result).includes("test-access-key"), false);
    assert.equal(
        JSON.stringify(result).includes("secret-that-must-not-appear"),
        false
    );
});

test("cdn image configuration accepts the user Qiniu environment variable names", () => {
    const config = getCdnImageConfig(
        {
            base_dir: "/site/",
            doratiger: {
                config: {
                    cdn_image: {
                        qiniu: { bucket: "test-bucket", region: "z0" },
                    },
                },
            },
        },
        {
            QINIU_AccessKey: "environment-access-key",
            QINIU_SecretKey: "environment-secret-key",
        }
    );

    assert.equal(config.qiniu.accessKey, "environment-access-key");
    assert.equal(config.qiniu.secretKey, "environment-secret-key");
});

test("source discovery resolves only post-body local images without public output", async (t) => {
    const fixtureDir = createFixture(t);
    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init();
    await hexo.load();

    assert.equal(fs.existsSync(path.join(fixtureDir, "public")), false);
    const assets = await findPostBodyImages(hexo);

    assert.deepEqual(
        assets.map((asset) => ({
            logicalPath: asset.logicalPath,
            objectKey: asset.objectKey,
        })),
        [
            { logicalPath: "images/site-photo.webp", objectKey: "images/images/site-photo.webp" },
            { logicalPath: "posts/demo/diagram-reference.png", objectKey: "images/posts/demo/diagram-reference.png" },
            { logicalPath: "posts/demo/diagram.png", objectKey: "images/posts/demo/diagram.png" },
            { logicalPath: "posts/demo/diagram@2x.png", objectKey: "images/posts/demo/diagram@2x.png" },
        ]
    );
    await hexo.exit();
});

test("manifest persists public metadata atomically and detects a changed object key", (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-cdn-manifest-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    const manifestPath = path.join(fixtureDir, "plugins", "cdn_image", ".hexo-cdn-image-manifest.json");
    const identity = {
        provider: "qiniu",
        bucket: "test-bucket",
        publicBaseUrl: "https://cdn.example.test",
    };
    const manifest = {
        version: 1,
        ...identity,
        entries: {
            "posts/demo/diagram.png": {
                objectKey: "images/posts/demo/diagram.png",
                sha256: "old-hash",
                size: 3,
                source: "_posts/demo/diagram.png",
            },
        },
    };

    writeManifestAtomically(manifestPath, manifest);
    assert.deepEqual(readManifest(manifestPath), manifest);
    assert.equal(fs.existsSync(`${manifestPath}.tmp`), false);

    const diff = diffManifest(
        manifest,
        [{
            logicalPath: "posts/demo/diagram.png",
            objectKey: "other-prefix/posts/demo/diagram.png",
            sha256: "old-hash",
            size: 3,
            sourcePath: "/site/source/_posts/demo/diagram.png",
        }],
        identity
    );
    assert.deepEqual(diff.changed.map((entry) => entry.logicalPath), ["posts/demo/diagram.png"]);
    assert.deepEqual(diff.current, []);
});

test("cdn check discovers source images without creating a manifest or public output", async (t) => {
    const fixtureDir = createFixture(t);
    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init();
    await assert.rejects(
        () => runCdnCommand(hexo, { _: ["check"] }),
        /manifest is missing/
    );
    assert.equal(
        fs.existsSync(path.join(fixtureDir, "plugins", "cdn_image")),
        false
    );
    assert.equal(fs.existsSync(path.join(fixtureDir, "public")), false);
    await hexo.exit();
});

test("encrypted post content keeps CDN image URLs after browser decryption", async (t) => {
    const fixtureDir = createFixture(t);
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "cdn_image:",
        "  enable: true",
        "  provider: qiniu",
        "  public_base_url: https://cdn.example.test",
        "  key_prefix: images",
        "  qiniu:",
        "    bucket: test-bucket",
        "encrypt:",
        "  enable: true",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "secret.md"), [
        "---",
        "title: Secret",
        "date: 2026-09-05 00:00:00",
        "password: fixture-password",
        "---",
        "![secret](diagram.png)",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "secret", "diagram.png"), "secret-image");
    writeManifestAtomically(path.join(fixtureDir, "plugins", "cdn_image", ".hexo-cdn-image-manifest.json"), {
        version: 1,
        provider: "qiniu",
        bucket: "test-bucket",
        publicBaseUrl: "https://cdn.example.test",
        entries: {
            "posts/secret/diagram.png": {
                objectKey: "images/posts/secret/diagram.png",
                sha256: "fixture-hash",
            },
        },
    });

    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init();
    await hexo.call("generate", { force: true });
    const html = fs.readFileSync(path.join(fixtureDir, "public", "posts", "secret", "index.html"), "utf8");
    const salt = /data-salt="([^"]+)"/.exec(html)[1];
    const iv = /data-iv="([^"]+)"/.exec(html)[1];
    const tag = /data-tag="([^"]+)"/.exec(html)[1];
    const payload = /class="hexo-encrypt-data"[^>]*>([0-9a-f]+)<\/div>/.exec(html)[1];
    const key = crypto.pbkdf2Sync("fixture-password", Buffer.from(salt, "hex"), 100000, 32, "sha256");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    const content = Buffer.concat([decipher.update(payload, "hex"), decipher.final()]).toString("utf8");

    assert.match(content, /src="https:\/\/cdn\.example\.test\/images\/posts\/secret\/diagram\.png"/);
    await hexo.exit();
});

test("HTML rewrite uses manifest object keys and preserves external URLs and suffixes", (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-cdn-rewrite-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    const manifestPath = path.join(fixtureDir, "plugins", "cdn_image", ".hexo-cdn-image-manifest.json");
    writeManifestAtomically(manifestPath, {
        version: 1,
        provider: "qiniu",
        bucket: "test-bucket",
        publicBaseUrl: "https://cdn.example.test",
        entries: {
            "posts/demo/diagram.png": { objectKey: "images/posts/demo/diagram.png", sha256: "hash" },
        },
    });
    const hexo = {
        base_dir: fixtureDir,
        doratiger: {
            config: {
                cdn_image: {
                    enable: true,
                    provider: "qiniu",
                    public_base_url: "https://cdn.example.test",
                    key_prefix: "images",
                    qiniu: { bucket: "test-bucket" },
                },
            },
        },
        log: { warn() {} },
    };
    const html = '<img src="/posts/demo/diagram.png?raw=1#top"><source srcset="/posts/demo/diagram.png 1x, https://example.com/external.png 2x">';

    assert.equal(
        rewriteCdnImageHtml(hexo, html),
        '<img src="https://cdn.example.test/images/posts/demo/diagram.png?raw=1#top"><source srcset="https://cdn.example.test/images/posts/demo/diagram.png 1x, https://example.com/external.png 2x">'
    );
});

test("HTML rewrite resolves a post's relative body image against its generated path", (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-cdn-relative-rewrite-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    const manifestPath = path.join(fixtureDir, "plugins", "cdn_image", ".hexo-cdn-image-manifest.json");
    writeManifestAtomically(manifestPath, {
        version: 1,
        provider: "qiniu",
        bucket: "test-bucket",
        publicBaseUrl: "https://cdn.example.test",
        entries: {
            "posts/demo/diagram.png": { objectKey: "images/posts/demo/diagram.png", sha256: "hash" },
        },
    });
    const hexo = {
        base_dir: fixtureDir,
        doratiger: { config: { cdn_image: { enable: true, provider: "qiniu", public_base_url: "https://cdn.example.test", qiniu: { bucket: "test-bucket" } } } },
    };

    assert.equal(
        rewriteCdnImageHtml(hexo, '<img src="diagram.png">', { pagePath: "posts/demo/" }),
        '<img src="https://cdn.example.test/images/posts/demo/diagram.png">'
    );
});

test("HTML rewrite preserves local image candidates for optional CDN fallback", (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-cdn-fallback-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    const manifestPath = path.join(fixtureDir, "plugins", "cdn_image", ".hexo-cdn-image-manifest.json");
    writeManifestAtomically(manifestPath, {
        version: 1,
        provider: "qiniu",
        bucket: "test-bucket",
        publicBaseUrl: "https://cdn.example.test",
        entries: {
            "posts/demo/diagram.png": { objectKey: "images/posts/demo/diagram.png", sha256: "hash" },
        },
    });
    const hexo = {
        base_dir: fixtureDir,
        doratiger: { config: { cdn_image: {
            enable: true,
            provider: "qiniu",
            public_base_url: "https://cdn.example.test",
            fallback: { enable: true },
            qiniu: { bucket: "test-bucket" },
        } } },
    };

    assert.equal(
        rewriteCdnImageHtml(hexo, '<img src="/posts/demo/diagram.png?raw=1"><source srcset="/posts/demo/diagram.png 1x">'),
        '<img src="https://cdn.example.test/images/posts/demo/diagram.png?raw=1" data-cdn-image-fallback-src="/posts/demo/diagram.png?raw=1"><source srcset="https://cdn.example.test/images/posts/demo/diagram.png 1x" data-cdn-image-fallback-srcset="/posts/demo/diagram.png 1x">'
    );
});

test("CDN fallback injector adds its browser listener only when enabled", () => {
    const injectFallback = require("../scripts/injectors/lib/injector-cdn-image-fallback.js");
    const enabled = injectFallback({
        base_dir: "/site/",
        extend: { helper: { get: () => (value) => `/blog${value}` } },
        doratiger: { config: { cdn_image: { enable: true, fallback: { enable: true } } } },
    });
    const disabled = injectFallback({
        base_dir: "/site/",
        extend: { helper: { get: () => (value) => `/blog${value}` } },
        doratiger: { config: { cdn_image: { enable: true, fallback: { enable: false } } } },
    });
    assert.equal(enabled, '<script src="/blog/js/utils/cdnImageFallback.js"></script>');
    assert.equal(disabled, "");
});

test("Qiniu provider uploads a small image without exposing credentials in its request body", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-cdn-qiniu-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    const sourcePath = path.join(fixtureDir, "diagram.png");
    fs.writeFileSync(sourcePath, "diagram");
    const calls = [];
    const provider = createQiniuProvider(
        {
            bucket: "test-bucket",
            region: "z0",
            accessKey: "test-access-key",
            secretKey: "test-secret-key",
        },
        {
            async request(options, body) {
                calls.push({ options, body });
                return { statusCode: 200, headers: {}, body: JSON.stringify({ key: "test/diagram.png", hash: "etag" }) };
            },
        }
    );

    const result = await provider.upload({ sourcePath, objectKey: "test/diagram.png", sha256: "hash" });
    assert.deepEqual(result, { objectKey: "test/diagram.png", etag: "etag", size: 7 });
    assert.equal(calls[0].options.host, "up-z0.qiniup.com");
    assert.equal(String(calls[0].body).includes("test-secret-key"), false);
});

test("Qiniu URL-safe base64 preserves RFC padding used by upload-token signatures", () => {
    assert.equal(base64url("a"), "YQ==");
});

test("Qiniu provider restricts delete requests to a signed manifest object key", async () => {
    const calls = [];
    const provider = createQiniuProvider(
        { bucket: "test-bucket", region: "z0", accessKey: "test-access-key", secretKey: "test-secret-key" },
        { async request(options) { calls.push(options); return { statusCode: 200, body: "" }; } }
    );
    await provider.remove("images/posts/demo/diagram.png");
    assert.equal(calls[0].host, "rs-z0.qiniuapi.com");
    assert.match(calls[0].path, /^\/delete\//);
    assert.equal(JSON.stringify(calls[0]).includes("test-secret-key"), false);
});

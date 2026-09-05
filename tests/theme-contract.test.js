"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const Hexo = require("hexo");

const themeDir = path.resolve(__dirname, "..");
const hostDir = path.resolve(themeDir, "../..");

const write = (target, content) => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
};

test("theme honors a subpath root across generated assets, routes, and metadata", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-theme-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));

    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");

    write(path.join(fixtureDir, "_config.yml"), [
        "title: Theme contract fixture",
        "description: Fixture description",
        "author: Fixture author",
        "language: en",
        "url: https://example.test",
        "root: /blog/",
        "theme: hexo-theme-doratiger",
        "permalink: :title/",
        "index_generator:",
        "  path: ''",
        "  per_page: 10",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "global:",
        "  avatar: /images/root-avatar.png",
        "search:",
        "  enable: true",
        "  type: algolia",
        "  algolia:",
        "    app_id: ''",
        "    api_key: ''",
        "    search_key: ''",
        "    index_name: ''",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_data", "doratiger_config.yml"), [
        "global:",
        "  favicon: /images/legacy-favicon.png",
        "  avatar: /images/legacy-avatar.png",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "hello.md"), [
        "---",
        "title: Hello",
        "date: 2026-09-05 00:00:00",
        "---",
        "Hello world.",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "about", "index.md"), [
        "---",
        "title: about",
        "layout: about",
        "---",
        "About.",
    ].join("\n") + "\n");

    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init();
    assert.equal(hexo.env.init, true);
    await hexo.load();
    assert.deepEqual(hexo.locals.get("data").doratiger_config, {
        global: {
            favicon: "/images/legacy-favicon.png",
            avatar: "/images/legacy-avatar.png",
        },
    });
    await hexo.call("generate", { force: true });

    const index = fs.readFileSync(path.join(fixtureDir, "public", "index.html"), "utf8");
    const page404 = fs.readFileSync(path.join(fixtureDir, "public", "404.html"), "utf8");
    const terms = fs.readFileSync(path.join(fixtureDir, "public", "terms", "index.html"), "utf8");
    const css = fs.readFileSync(path.join(fixtureDir, "public", "css", "main.css"), "utf8");

    assert.match(index, /href="\/blog\/css\/main\.css"/);
    assert.match(index, /src="\/blog\/js\/main\.js"/);
    assert.match(index, /href="\/blog\/images\/legacy-favicon\.png"/);
    assert.match(index, /property="og:image" content="\/blog\/images\/root-avatar\.png"/);
    assert.match(index, /class="author-info-avatar-img" src="\/blog\/images\/root-avatar\.png"/);
    assert.match(index, /class="post-item-header-title" href="\/blog\/hello\/"/);
    assert.match(index, /window\.location\.href = '\/blog\/redirect\/\?url=' \+ url/);
    assert.match(page404, /window\.location\.href = '\/blog\/'/);
    assert.match(terms, /href="\/blog\/privacy\/"/);
    assert.doesNotMatch(css, /\$color-(?:font|theme-font)/);

    await assert.doesNotReject(hexo.call("algolia", { "dry-run": true }));
    await hexo.exit();
});

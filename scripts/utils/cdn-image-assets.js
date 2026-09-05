"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { getCdnImageConfig } = require("./cdn-image-config.js");

const IMAGE_EXTENSIONS = new Set([
    ".avif",
    ".gif",
    ".heic",
    ".jpeg",
    ".jpg",
    ".png",
    ".svg",
    ".webp",
]);

function isExternalUrl(value) {
    return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value);
}

function extractImageUrls(html) {
    const values = [];
    const markdown = String(html || "");
    const tags = String(html || "").matchAll(/<(img|source)\b[^>]*>/gi);
    for (const tagMatch of tags) {
        const tag = tagMatch[0];
        const name = tagMatch[1].toLowerCase();
        if (name === "img") {
            const src = /\bsrc\s*=\s*(["'])(.*?)\1/i.exec(tag);
            if (src) values.push(src[2]);
        }
        const srcset = /\bsrcset\s*=\s*(["'])(.*?)\1/i.exec(tag);
        if (srcset) {
            for (const candidate of srcset[2].split(",")) {
                const url = candidate.trim().split(/\s+/, 1)[0];
                if (url) values.push(url);
            }
        }
    }
    for (const markdownImage of markdown.matchAll(/!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))/g)) {
        values.push(markdownImage[1] || markdownImage[2]);
    }

    const references = new Map();
    for (const definition of markdown.matchAll(/^\s*\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gm)) {
        references.set(definition[1].trim().replace(/\s+/g, " ").toLowerCase(), definition[2] || definition[3]);
    }
    for (const imageReference of markdown.matchAll(/!\[([^\]]*)\]\[([^\]]*)\]/g)) {
        const label = (imageReference[2] || imageReference[1]).trim().replace(/\s+/g, " ").toLowerCase();
        const url = references.get(label);
        if (url) values.push(url);
    }
    return values;
}

function buildAssetIndex(hexo) {
    const index = new Map();
    for (const modelName of ["Asset", "PostAsset"]) {
        for (const asset of hexo.model(modelName).toArray()) {
            const logicalPath = String(asset.path || "").replace(/^\/+/, "");
            if (!logicalPath || !IMAGE_EXTENSIONS.has(path.extname(logicalPath).toLowerCase())) {
                continue;
            }
            index.set(logicalPath, asset);
        }
    }
    return index;
}

function resolveLogicalPath(post, rawUrl) {
    if (!rawUrl || isExternalUrl(rawUrl)) return "";
    const url = new URL(rawUrl, `https://doratiger.invalid/${post.path}`);
    return decodeURIComponent(url.pathname).replace(/^\/+/, "");
}

function hashFile(sourcePath) {
    return crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
}

async function findPostBodyImages(hexo) {
    const config = getCdnImageConfig(hexo);
    const assets = buildAssetIndex(hexo);
    const result = new Map();
    const posts = hexo.model("Post").find({ published: true }).toArray();

    for (const post of posts) {
        // `content` is post-render HTML and may already contain CDN rewrites.
        // The source-backed `_content` remains stable across builds and is the
        // only valid basis for sync/check/prune idempotency.
        const sourceContent = post._content || post.raw || "";
        for (const rawUrl of extractImageUrls(sourceContent)) {
            const logicalPath = resolveLogicalPath(post, rawUrl);
            const asset = assets.get(logicalPath);
            if (!asset || result.has(logicalPath)) continue;

            const sourcePath = fs.realpathSync(asset.source);
            const relativeSourcePath = path.relative(hexo.source_dir, sourcePath);
            if (relativeSourcePath.startsWith("..") || path.isAbsolute(relativeSourcePath)) {
                throw new Error(`image source is outside Hexo source directory: ${logicalPath}`);
            }

            result.set(logicalPath, {
                postSource: post.source,
                sourcePath,
                logicalPath,
                objectKey: `${config.keyPrefix}/${logicalPath}`,
                sha256: hashFile(sourcePath),
            });
        }
    }

    return [...result.values()].sort((left, right) =>
        left.logicalPath.localeCompare(right.logicalPath)
    );
}

module.exports = {
    IMAGE_EXTENSIONS,
    extractImageUrls,
    findPostBodyImages,
    resolveLogicalPath,
};

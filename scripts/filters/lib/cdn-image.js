"use strict";

const { getCdnImageConfig } = require("../../utils/cdn-image-config.js");
const { readManifest, sameIdentity } = require("../../utils/cdn-image-manifest.js");
const { localLogicalPath, rewriteSrcset, splitSuffix } = require("../../utils/cdn-image-url.js");

function escapeAttribute(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function rewriteCdnImageHtml(hexo, html, { pagePath = "" } = {}) {
    const config = getCdnImageConfig(hexo);
    if (!config.enabled) return html;
    const manifest = readManifest(config.manifestPath);
    if (!manifest || !sameIdentity(manifest, {
        provider: config.provider,
        bucket: config.qiniu.bucket,
        publicBaseUrl: config.publicBaseUrl,
    })) return html;

    const replaceUrl = (value) => {
        const logicalPath = localLogicalPath(value, pagePath);
        const entry = logicalPath && manifest.entries[logicalPath];
        if (!entry) return value;
        return `${config.publicBaseUrl}/${entry.objectKey}${splitSuffix(value).suffix}`;
    };
    return String(html).replace(/<(img|source)\b[^>]*>/gi, (tag, name) => {
        let result = tag;
        if (name.toLowerCase() === "img") {
            result = result.replace(/\bsrc\s*=\s*(["'])(.*?)\1/i, (_m, quote, value) => {
                const rewritten = replaceUrl(value);
                const fallback = config.fallbackEnabled && rewritten !== value
                    ? ` data-cdn-image-fallback-src=${quote}${escapeAttribute(value)}${quote}`
                    : "";
                return `src=${quote}${rewritten}${quote}${fallback}`;
            });
        }
        return result.replace(/\bsrcset\s*=\s*(["'])(.*?)\1/i, (_m, quote, value) => {
            const rewritten = rewriteSrcset(value, replaceUrl);
            const fallback = config.fallbackEnabled && rewritten !== value
                ? ` data-cdn-image-fallback-srcset=${quote}${escapeAttribute(value)}${quote}`
                : "";
            return `srcset=${quote}${rewritten}${quote}${fallback}`;
        });
    });
}

module.exports = (hexo, html, options) => rewriteCdnImageHtml(hexo, html, options);
module.exports.rewriteCdnImageHtml = rewriteCdnImageHtml;

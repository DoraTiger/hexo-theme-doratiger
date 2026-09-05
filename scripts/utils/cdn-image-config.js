"use strict";

const path = require("path");
const { getThemeConfig } = require("./theme.js");

const DEFAULT_MANIFEST_PATH = path.join(
    "plugins",
    "cdn_image",
    ".hexo-cdn-image-manifest.json"
);
const DEFAULT_KEY_PREFIX = "images";

function normalizeOrigin(value) {
    const origin = String(value || "").trim().replace(/\/+$/, "");
    if (!origin) return "";

    try {
        const parsed = new URL(origin);
        return parsed.protocol === "https:" || parsed.protocol === "http:"
            ? origin
            : "";
    } catch {
        return "";
    }
}

function normalizeKeyPrefix(value) {
    const prefix = String(value || DEFAULT_KEY_PREFIX)
        .replace(/^\/+|\/+$/g, "")
        .trim();
    if (!prefix || prefix.split("/").some((part) => part === ".." || part === ".")) {
        return DEFAULT_KEY_PREFIX;
    }
    return prefix;
}

function getCdnImageConfig(hexo, env = process.env) {
    const theme = getThemeConfig(hexo);
    const configured = theme.cdn_image || (hexo.config && hexo.config.theme_config && hexo.config.theme_config.cdn_image) || {};
    const qiniu = configured.qiniu || {};
    const fallback = configured.fallback || {};
    const manifestRelativePath = String(
        configured.manifest_path || DEFAULT_MANIFEST_PATH
    );

    return {
        enabled: configured.enable === true,
        provider: String(configured.provider || "qiniu").toLowerCase(),
        publicBaseUrl: normalizeOrigin(configured.public_base_url),
        keyPrefix: normalizeKeyPrefix(configured.key_prefix),
        fallbackEnabled: fallback.enable === true,
        manifestPath: path.resolve(hexo.base_dir, manifestRelativePath),
        qiniu: {
            bucket: String(qiniu.bucket || "").trim(),
            region: String(qiniu.region || "").trim().toLowerCase(),
            accessKey: String(
                env.QINIU_AccessKey || env.QINIU_ACCESS_KEY || qiniu.access_key || ""
            ).trim(),
            secretKey: String(
                env.QINIU_SecretKey || env.QINIU_SECRET_KEY || qiniu.secret_key || ""
            ).trim(),
        },
    };
}

function validateCdnImageConfig(config, { requireCredentials = false } = {}) {
    const errors = [];
    if (config.provider !== "qiniu") errors.push("unsupported provider");
    if (!config.publicBaseUrl) errors.push("missing or invalid public CDN origin");
    if (!config.keyPrefix) errors.push("missing object key prefix");

    if (requireCredentials) {
        if (!config.qiniu.bucket) errors.push("missing Qiniu bucket");
        if (!config.qiniu.region) errors.push("missing Qiniu region");
        if (!config.qiniu.accessKey) errors.push("missing Qiniu access key");
        if (!config.qiniu.secretKey) errors.push("missing Qiniu secret key");
    }

    return { ok: errors.length === 0, errors };
}

module.exports = {
    DEFAULT_KEY_PREFIX,
    DEFAULT_MANIFEST_PATH,
    getCdnImageConfig,
    normalizeKeyPrefix,
    normalizeOrigin,
    validateCdnImageConfig,
};

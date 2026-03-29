"use strict";

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * 本地搜索索引生成器
 * 生成 JSON 格式的搜索索引，前端 JS 直接搜索
 */
module.exports = function (locals) {
    const theme = this.config.theme_config || {};

    if (!theme.search || !theme.search.enable || theme.search.type !== "local") return;

    const searchConfig = theme.search.local || {};
    const defaultFields = ["post", "page"];
    const normalizeFieldList = (value) => {
        const list = Array.isArray(value)
            ? value
            : typeof value === "string"
                ? [value]
                : [];

        const normalized = list
            .map((item) => String(item || "").trim().toLowerCase())
            .filter((item) => item === "post" || item === "page");

        return Array.from(new Set(normalized));
    };

    const getUserLocalConfig = () => {
        const themeName = this.config.theme;
        const rootDir = this.config.root || process.cwd();
        const userConfigPath = path.join(rootDir, `_config.${themeName}.yml`);

        try {
            if (!fs.existsSync(userConfigPath)) {
                return {};
            }
            const userConfigContent = fs.readFileSync(userConfigPath, "utf8");
            const userConfig = yaml.load(userConfigContent) || {};
            return (((userConfig.search || {}).local) || {});
        } catch (error) {
            this.log.warn("[local-search] failed to read user theme config, fallback to merged config", error);
            return {};
        }
    };

    const fieldMergeStrategy = String(searchConfig.field_merge_strategy || "merge").toLowerCase();
    let fields = normalizeFieldList(searchConfig.field);

    if (fieldMergeStrategy === "replace") {
        const userLocalConfig = getUserLocalConfig();
        const userFields = normalizeFieldList(userLocalConfig.field);
        fields = userFields.length ? userFields : defaultFields;
    } else if (!fields.length) {
        fields = defaultFields;
    }

    const includeContent = searchConfig.content === true;
    const rawContentMaxLength = parseInt(searchConfig.content_max_length, 10);
    const contentMaxLength = Number.isFinite(rawContentMaxLength) && rawContentMaxLength > 0
        ? rawContentMaxLength
        : 5000;
    const rawPath = searchConfig.path;
    const indexPath = Array.isArray(rawPath)
        ? rawPath[0]
        : typeof rawPath === "string"
            ? rawPath
            : "search.json";
    const normalizedIndexPath = (indexPath || "search.json").replace(/^\/+/, "");
    const siteUrl = this.config.url.replace(/\/$/, "");

    const index = [];
    const indexedUrls = new Set();

    const normalizeUrl = (path) => siteUrl + (path.startsWith("/") ? path : "/" + path);

    const pushIndexItem = (item) => {
        if (!item || typeof item.url !== "string" || !item.url) return;
        if (indexedUrls.has(item.url)) return;
        indexedUrls.add(item.url);
        index.push(item);
    };

    // 文章索引
    if (fields.includes("post")) {
        locals.posts.sort("-date").forEach((post) => {
            if (post.published === false) return;
            if (post.search === false) return;
            if (post.password && post.search !== true) return;

            const item = {
                title: post.title || "",
                url: normalizeUrl(post.path),
                date: post.date.toISOString(),
                updated: post.updated ? post.updated.toISOString() : "",
                tags: (post.tags || []).map((t) => t.name),
                categories: (post.categories || []).map((c) => c.name),
            };

            const excerpt = (post.excerpt || post.content || "")
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim();
            item.excerpt = excerpt.substring(0, 200);

            if (includeContent) {
                item.content = excerpt.substring(0, contentMaxLength);
            }

            pushIndexItem(item);
        });
    }

    // 页面索引
    if (fields.includes("page")) {
        locals.pages.forEach((page) => {
            if (page.search === false) return;
            if (page.password && page.search !== true) return;

            const excerpt = (page.excerpt || page.content || "")
                .replace(/<[^>]+>/g, "")
                .replace(/\s+/g, " ")
                .trim();

            const item = {
                title: page.title || "",
                url: normalizeUrl(page.path),
                excerpt: excerpt.substring(0, 200),
            };

            if (includeContent) {
                item.content = excerpt.substring(0, contentMaxLength);
            }

            pushIndexItem(item);
        });
    }

    return {
        path: normalizedIndexPath,
        data: JSON.stringify({
            schemaVersion: 1,
            generatedAt: new Date().toISOString(),
            items: index,
        }),
    };
};

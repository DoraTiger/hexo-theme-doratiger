"use strict";

/**
 * 本地搜索索引生成器
 * 生成 JSON 格式的搜索索引，前端 JS 直接搜索
 */
module.exports = function (locals) {
    const theme = this.config.theme_config || {};

    if (!theme.search || !theme.search.enable || theme.search.type !== "local") return;

    const searchConfig = theme.search.local || {};
    const fields = searchConfig.field || ["post"];
    const includeContent = searchConfig.content === true;
    const indexPath = (searchConfig.path && searchConfig.path[0]) || "search.json";
    const siteUrl = this.config.url.replace(/\/$/, "");

    const index = [];

    // 文章索引
    if (fields.includes("post")) {
        locals.posts.sort("-date").forEach((post) => {
            if (post.published === false) return;
            if (post.search === false) return;
            if (post.password && post.search !== true) return;

            const item = {
                title: post.title || "",
                url: siteUrl + (post.path.startsWith("/") ? post.path : "/" + post.path),
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
                item.content = excerpt;
            }

            index.push(item);
        });
    }

    // 页面索引
    if (fields.includes("page")) {
        locals.pages.forEach((page) => {
            if (page.search === false) return;
            if (page.password && page.search !== true) return;

            index.push({
                title: page.title || "",
                url: siteUrl + (page.path.startsWith("/") ? page.path : "/" + page.path),
                excerpt: (page.excerpt || page.content || "")
                    .replace(/<[^>]+>/g, "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .substring(0, 200),
            });
        });
    }

    return {
        path: indexPath,
        data: JSON.stringify(index),
    };
};

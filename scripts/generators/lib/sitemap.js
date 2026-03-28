"use strict";

/**
 * sitemap.xml Generator
 * 根据主题配置动态生成 sitemap.xml
 */
module.exports = function (locals) {
    const theme = this.theme.config;
    const site = this.config;

    if (!theme.sitemap || theme.sitemap.enable === false) return;

    const siteUrl = site.url.replace(/\/$/, "");

    // 确保路径以 / 开头
    const normalize = (p) => (p.startsWith("/") ? p : "/" + p);
    const changefreq = theme.sitemap.changefreq || "weekly";
    const priority = theme.sitemap.priority || {};

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 首页
    xml += buildUrl(siteUrl + "/", "daily", priority.home || 1.0);

    // 文章
    locals.posts.sort("-date").forEach((post) => {
        if (post.published !== false) {
            xml += buildUrl(
                siteUrl + normalize(post.path),
                changefreq,
                priority.post || 0.8,
                post.updated.toISOString()
            );
        }
    });

    // 页面（关于、服务条款、隐私政策等）
    locals.pages.forEach((page) => {
        xml += buildUrl(
            siteUrl + normalize(page.path),
            "monthly",
            priority.page || 0.6
        );
    });

    // 分类
    locals.categories.forEach((cat) => {
        xml += buildUrl(
            siteUrl + normalize(cat.path),
            "weekly",
            priority.category || 0.5
        );
    });

    // 标签
    locals.tags.forEach((tag) => {
        xml += buildUrl(
            siteUrl + normalize(tag.path),
            "weekly",
            priority.tag || 0.5
        );
    });

    // 归档
    xml += buildUrl(siteUrl + "/archives/", "weekly", priority.archive || 0.4);

    xml += "</urlset>\n";

    return {
        path: "sitemap.xml",
        data: xml,
    };
};

function buildUrl(loc, freq, priority, lastmod) {
    let entry = "  <url>\n";
    entry += `    <loc>${escapeXml(loc)}</loc>\n`;
    if (lastmod) {
        entry += `    <lastmod>${lastmod}</lastmod>\n`;
    }
    entry += `    <changefreq>${freq}</changefreq>\n`;
    entry += `    <priority>${priority.toFixed(1)}</priority>\n`;
    entry += "  </url>\n";
    return entry;
}

function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

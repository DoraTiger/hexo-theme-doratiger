"use strict";

/**
 * sitemap Generator
 * 根据主题配置动态生成 sitemap.xml 和/或 sitemap.txt
 */
module.exports = function (locals) {
    const theme = this.theme.config;
    const site = this.config;

    if (!theme.sitemap || theme.sitemap.enable === false) return;

    const siteUrl = site.url.replace(/\/$/, "");
    const normalize = (p) => (p.startsWith("/") ? p : "/" + p);
    const changefreq = theme.sitemap.changefreq || "weekly";
    const priority = theme.sitemap.priority || {};
    const format = theme.sitemap.format || "xml"; // xml | txt | both

    // 收集所有 URL
    const urls = [];

    // 首页
    urls.push({
        loc: siteUrl + "/",
        freq: "daily",
        priority: priority.home || 1.0,
    });

    // 文章
    locals.posts.sort("-date").forEach((post) => {
        if (post.published !== false && post.sitemap !== false) {
            urls.push({
                loc: siteUrl + normalize(post.path),
                freq: changefreq,
                priority: priority.post || 0.8,
                lastmod: post.updated.toISOString(),
            });
        }
    });

    // 页面
    locals.pages.forEach((page) => {
        if (page.sitemap !== false) {
            urls.push({
                loc: siteUrl + normalize(page.path),
                freq: "monthly",
                priority: priority.page || 0.6,
            });
        }
    });

    // 分类
    locals.categories.forEach((cat) => {
        urls.push({
            loc: siteUrl + normalize(cat.path),
            freq: "weekly",
            priority: priority.category || 0.5,
        });
    });

    // 标签
    locals.tags.forEach((tag) => {
        urls.push({
            loc: siteUrl + normalize(tag.path),
            freq: "weekly",
            priority: priority.tag || 0.5,
        });
    });

    // 归档
    urls.push({
        loc: siteUrl + "/archives/",
        freq: "weekly",
        priority: priority.archive || 0.4,
    });

    // 生成输出
    const results = [];

    if (format === "xml" || format === "both") {
        results.push({
            path: "sitemap.xml",
            data: buildXml(urls),
        });
    }

    if (format === "txt" || format === "both") {
        results.push({
            path: "sitemap.txt",
            data: buildTxt(urls),
        });
    }

    return results;
};

// XML 格式
function buildXml(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach((u) => {
        xml += "  <url>\n";
        xml += `    <loc>${escapeXml(u.loc)}</loc>\n`;
        if (u.lastmod) {
            xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
        }
        xml += `    <changefreq>${u.freq}</changefreq>\n`;
        xml += `    <priority>${u.priority.toFixed(1)}</priority>\n`;
        xml += "  </url>\n";
    });

    xml += "</urlset>\n";
    return xml;
}

// TXT 格式（纯 URL 列表）
function buildTxt(urls) {
    return urls.map((u) => u.loc).join("\n") + "\n";
}

function escapeXml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

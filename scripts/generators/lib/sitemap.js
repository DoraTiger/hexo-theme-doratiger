"use strict";

const { plan } = require('../../utils/sitemap');

/**
 * sitemap Generator
 * 根据主题配置动态生成 sitemap.xml 和/或 sitemap.txt
 */
module.exports = function (locals) {
    const { urls, files } = plan(this, locals);
    const results = [];

    if (files.includes('sitemap.xml')) {
        results.push({
            path: "sitemap.xml",
            data: buildXml(urls),
        });
    }

    if (files.includes('sitemap.txt')) {
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

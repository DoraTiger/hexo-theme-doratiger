"use strict";

/**
 * robots.txt Generator
 * 根据主题配置动态生成 robots.txt
 */
module.exports = function (locals) {
    const theme = this.theme.config;
    const site = this.config;

    if (!theme.robots || theme.robots.enable === false) return;

    const siteUrl = site.url.replace(/\/$/, "");
    const disallow = theme.robots.disallow || ["/admin/", "/api/", "/tmp/"];

    let content = `# ${siteUrl}/robots.txt\n\n`;
    content += "User-agent: *\n";
    content += "Allow: /\n\n";

    disallow.forEach((path) => {
        content += `Disallow: ${path}\n`;
    });

    content += `\nSitemap: ${siteUrl}/sitemap.xml\n`;

    return {
        path: "robots.txt",
        data: content,
    };
};

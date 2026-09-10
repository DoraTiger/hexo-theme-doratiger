"use strict";

const { getThemeConfig } = require('../../utils/theme');
const { plan, fileUrl } = require('../../utils/sitemap');

/**
 * robots.txt Generator
 * 根据主题配置动态生成 robots.txt
 */
module.exports = function (locals) {
    const theme = getThemeConfig(this);

    if (!theme.robots || theme.robots.enable === false) return;

    const disallow = theme.robots.disallow || ["/admin/", "/api/", "/tmp/"];

    let content = `# ${fileUrl(this, 'robots.txt')}\n\n`;
    content += "User-agent: *\n";
    content += "Allow: /\n\n";

    disallow.forEach((path) => {
        content += `Disallow: ${path}\n`;
    });

    for (const file of plan(this, locals).files) content += `\nSitemap: ${fileUrl(this, file)}\n`;

    return {
        path: "robots.txt",
        data: content,
    };
};

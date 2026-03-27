/**
 * 外部链接重定向过滤器
 * 保持原始链接不变，通过 JS 拦截点击跳转到重定向页面
 */
"use strict";

module.exports = function (hexo, data) {
    const theme = hexo.theme.config;

    if (!theme.redirect || theme.redirect.enable === false) return data;
    if (!data.content) return data;

    const siteUrl = hexo.config.url.replace(/\/$/, "");
    const exclude = theme.redirect.exlude || [];

    // 从主题配置获取站点 URL
    const siteHostname = new URL(hexo.config.url).hostname;

    // 解析 exclude 规则
    const shouldRedirect = (url) => {
        try {
            const parsed = new URL(url, siteUrl);
            if (parsed.hostname === siteHostname) return false;
            if (exclude.some((e) => parsed.hostname.includes(e))) return false;
            return true;
        } catch {
            return false;
        }
    };

    // 匹配 <a href="..."> 标签，添加 data-redirect 标记
    data.content = data.content.replace(
        /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
        (match, pre, url, post) => {
            if (!/^https?:\/\//i.test(url)) return match;
            if (!shouldRedirect(url)) return match;

            // 移除重复的 class
            let cleanPost = post.replace(/\s+class=["'][^"']*["']/gi, "");

            return `<a ${pre}href="${url}"${cleanPost} class="external-link" data-redirect="${encodeURIComponent(url)}" target="_blank" rel="noopener noreferrer">`;
        }
    );

    return data;
};

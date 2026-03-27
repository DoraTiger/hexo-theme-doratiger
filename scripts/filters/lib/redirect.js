/**
 * 外部链接重定向过滤器
 * 将文章中的外部链接替换为重定向页面链接
 */
"use strict";

module.exports = function (hexo, data) {
    const theme = hexo.theme.config;

    if (!theme.redirect || theme.redirect.enable === false) return data;
    if (!data.content) return data;

    const siteUrl = hexo.config.url.replace(/\/$/, "");
    const exclude = theme.redirect.exlude || [];
    // include 用于重定向页面自身索引，filter 中不使用
    // const include = theme.redirect.include || [];

    // 从主题配置获取站点 URL
    const siteHostname = new URL(hexo.config.url).hostname;

    // 解析 exclude 规则
    const shouldRedirect = (url) => {
        try {
            const parsed = new URL(url, siteUrl);
            // 站内链接不重定向
            if (parsed.hostname === siteHostname) return false;
            // exclude 列表中的不重定向
            if (exclude.some((e) => parsed.hostname.includes(e))) return false;
            // 其余外链都重定向
            return true;
        } catch {
            return false;
        }
    };

    // 匹配 <a href="..."> 标签
    data.content = data.content.replace(
        /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi,
        (match, pre, url, post) => {
            // 跳过非 http 链接（mailto:, tel:, #, javascript: 等）
            if (!/^https?:\/\//i.test(url)) return match;
            if (!shouldRedirect(url)) return match;

            // 移除 post 中已有的 class，避免重复
            let cleanPost = post.replace(/\s+class=["'][^"']*["']/gi, "");

            const redirectUrl = `/redirect/?url=${encodeURIComponent(url)}`;
            return `<a ${pre}href="${redirectUrl}"${cleanPost} class="external-link" title="${url}" target="_blank" rel="noopener noreferrer">`;
        }
    );

    return data;
};

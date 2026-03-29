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
    const normalizeList = (value) => {
        if (Array.isArray(value)) {
            return value
                .map((item) => String(item || "").trim().toLowerCase())
                .filter(Boolean);
        }
        if (typeof value === "string") {
            const item = value.trim().toLowerCase();
            return item ? [item] : [];
        }
        return [];
    };

    const method = String(theme.redirect.method || "exclude").toLowerCase();
    const include = normalizeList(theme.redirect.include);
    const exclude = normalizeList(theme.redirect.exclude);

    // 从主题配置获取站点 URL
    let siteHostname = "";
    try {
        siteHostname = new URL(hexo.config.url).hostname.toLowerCase();
    } catch {
        return data;
    }

    const hostMatches = (hostname, rules) => {
        return rules.some((rule) => {
            // 允许精确匹配与子域名匹配：example.com -> www.example.com
            return hostname === rule || hostname.endsWith(`.${rule}`);
        });
    };

    // 解析 include / exclude 规则
    const shouldRedirect = (url) => {
        try {
            const parsed = new URL(url, siteUrl);
            const host = parsed.hostname.toLowerCase();

            // 站内链接不进入重定向页
            if (host === siteHostname) return false;

            if (method === "include") {
                // include 模式：仅命中 include 列表时重定向
                return hostMatches(host, include);
            }

            // exclude 模式（默认）：命中 exclude 列表则不重定向
            if (hostMatches(host, exclude)) return false;
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

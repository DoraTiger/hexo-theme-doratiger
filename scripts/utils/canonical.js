'use strict';

const { full_url_for: fullUrlFor } = require('hexo-util');

function invalid() {
    // Never echo a potentially credential-bearing configured URL.
    throw new Error('[CANONICAL_CONFIG] Invalid canonical URL/configuration / canonical 地址或配置无效');
}
function absolute(value, base = false) {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value) || /[\s\\]/.test(value)) invalid();
    let url;
    try { url = new URL(value); } catch { invalid(); }
    if (!url.hostname || url.username || url.password || (base && (url.search || url.hash))) invalid();
    url.hash = '';
    return url;
}
function policy(config, theme) {
    const settings = theme.canonical || {};
    if (typeof settings !== 'object' || Array.isArray(settings) ||
        (settings.enable !== undefined && typeof settings.enable !== 'boolean')) invalid();
    const site = absolute(config.url, true);
    // Hexo installations may specify the mount either in url or separately in root.
    if (site.pathname === '/' && config.root && config.root !== '/') site.pathname = config.root;
    const currentBase = site.href.replace(/\/$/, '');
    const enabled = settings.enable !== false;
    const preferredBase = enabled && settings.base_url !== undefined && settings.base_url !== ''
        ? absolute(settings.base_url, true).href.replace(/\/$/, '') : currentBase;
    return { enabled, currentBase, preferredBase };
}
function routeUrl(config, base, route) {
    // Only Hexo's site-relative routes enter here, never externally supplied URLs.
    const relative = route.split(/[?#]/)[0].replace(/^\/+/, '').replace(/(^|\/)index\.html$/, '$1');
    const url = fullUrlFor.call({ config: { ...config, url: base } }, relative);
    return absolute(url).href;
}
function resolve(config, theme, page) {
    const options = policy(config, theme);
    if (typeof page.path !== 'string') return { current: null, canonical: null };
    const route = page.path;
    const current = routeUrl(config, options.currentBase, route);
    const internal = /^(?:404\.html|redirect\/(?:index\.html)?)$/.test(route.replace(/^\//, ''));
    const excluded = internal || page.published === false;
    let canonical = null;
    if (options.enabled && !excluded && page.canonical !== false) {
        canonical = page.canonical === undefined
            ? routeUrl(config, options.preferredBase, route) : absolute(page.canonical).href;
    }
    return { current, canonical, excluded, enabled: options.enabled };
}
function sitemapUrl(config, theme, page) {
    const result = resolve(config, theme, page);
    if (page.sitemap === false || result.excluded || !result.current) return null;
    // A canonical-disabled site retains ordinary sitemap behavior. Per-page
    // exclusions and aliases never advertise another page as this page's URL.
    if (!result.enabled) return result.current;
    return result.canonical === result.current ? result.current : null;
}
module.exports = { resolve, sitemapUrl, policy, routeUrl };

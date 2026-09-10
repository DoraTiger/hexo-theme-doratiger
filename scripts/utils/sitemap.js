'use strict';
const { getThemeConfig } = require('./theme');
const { sitemapUrl, routeUrl, policy } = require('./canonical');

// Both generators consume this plan; neither depends on generator execution order.
function plan(hexo, locals) {
    const theme = getThemeConfig(hexo), site = hexo.config;
    if (!theme.sitemap || theme.sitemap.enable === false) return { urls: [], files: [] };
    const settings = theme.sitemap, priority = settings.priority || {};
    const urls = [], seen = new Set();
    const add = (page, kind, freq, fallback, lastmod) => {
        const loc = sitemapUrl(site, theme, page);
        if (!loc || seen.has(loc)) return;
        seen.add(loc);
        urls.push({ loc, freq, priority: priority[kind] ?? fallback, ...(lastmod ? { lastmod } : {}) });
    };
    const home = site.index_generator?.path || '';
    // hexo-pagination treats its base as a directory even without a trailing slash.
    add({ path: home && !home.endsWith('/') ? `${home}/` : home }, 'home', 'daily', 1);
    locals.posts.sort('-date').forEach(post => add(post, 'post', settings.changefreq || 'weekly', 0.8, post.updated?.toISOString()));
    locals.pages.forEach(page => add(page, 'page', 'monthly', 0.6));
    locals.categories.forEach(category => add(category, 'category', 'weekly', 0.5));
    locals.tags.forEach(tag => add(tag, 'tag', 'weekly', 0.5));
    if (site.archive_generator?.enabled !== false) add({ path: `${(site.archive_dir || 'archives').replace(/\/$/, '')}/` }, 'archive', 'weekly', 0.4);
    const format = settings.format || 'xml';
    const files = urls.length ? [
        ...(['xml', 'both'].includes(format) ? ['sitemap.xml'] : []),
        ...(['txt', 'both'].includes(format) ? ['sitemap.txt'] : []),
    ] : [];
    return { urls, files };
}
function fileUrl(hexo, name) {
    return routeUrl(hexo.config, policy(hexo.config, getThemeConfig(hexo)).currentBase, name);
}
module.exports = { plan, fileUrl };

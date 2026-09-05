"use strict";

/**
 * Return the theme configuration assembled by the theme lifecycle.
 *
 * `ready` makes this available before Hexo publishes `theme.config`, while
 * `generateBefore` later publishes the same merged object to templates.
 */
function getThemeConfig(hexo) {
    if (hexo.doratiger && hexo.doratiger.config) {
        return hexo.doratiger.config;
    }

    return (hexo.theme && hexo.theme.config) || {};
}

module.exports = { getThemeConfig };

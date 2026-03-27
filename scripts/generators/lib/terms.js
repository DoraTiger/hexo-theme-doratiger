"use strict";

/**
 * Terms of Service Page Generator
 * 根据主题配置动态生成服务条款页
 */
module.exports = function (locals) {
    const theme = this.theme.config;

    if (!theme.terms || theme.terms.enable === false) return;

    return {
        path: "terms/index.html",
        data: locals,
        layout: ["terms"],
    };
};

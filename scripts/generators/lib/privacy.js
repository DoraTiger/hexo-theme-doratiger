"use strict";

/**
 * Privacy Policy Page Generator
 * 根据主题配置动态生成隐私政策页
 */
module.exports = function (locals) {
    const theme = this.theme.config;

    if (!theme.privacy || theme.privacy.enable === false) return;

    return {
        path: "privacy/index.html",
        data: locals,
        layout: ["privacy"],
    };
};

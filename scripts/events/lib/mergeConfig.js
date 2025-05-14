"use strict";

const { theme } = require("hexo/dist/hexo/default_config");
const log = require("../../utils/log");
const { merge } = require("../../utils/object");

module.exports = (hexo) => {
    // hexo 主题配置对象
    const themeConfig = hexo.theme.config;
    const themeI18nConfig = hexo.theme.i18n;
    // DoraTiger 主题配置对象
    const doratiger = hexo.doratiger;

    hexo.theme.config = merge({}, themeConfig, doratiger.config);
    hexo.theme.i18n.data = merge({}, themeI18nConfig.data, doratiger.i18n.data);
};

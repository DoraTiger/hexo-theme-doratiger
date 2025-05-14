"use strict";

const fs = require("fs");
const path = require("path");
const { isNotEmptyObject, merge } = require("../../utils/object");
const log = require("../../utils/log");
const yaml = require("js-yaml");
/**
 *
 * @param {*} hexo - hexo 实例
 * @returns {object} themeConfig - 旧配置
 * @description 从 /_data/doratiger_config.yml 获取主题配置
 */
const getDataThemeConfig = (hexo) => {
    let themeConfig = {};
    if (hexo.locals.get instanceof Function) {
        const data = hexo.locals.get("data");
        if (data && isNotEmptyObject(data.doratiger_config)) {
            themeConfig = yaml.load(data.doratiger_config);
        }
    }
    if (
        (isNotEmptyObject(themeConfig) && hexo.version.split(".")[0] >= 5) ||
        !fs.existsSync(
            path.join(hexo.base_dir, "_config.hexo-theme-doratiger.yml")
        )
    ) {
        log(
            hexo,
            "[DoraTiger] 推荐使用根目录下的 _config.hexo-theme-doratiger.yml 配置主题",
            "[DoraTiger] It is recommended to use the _config.hexo-theme-doratiger.yml in the root directory to configure the theme",
            "warn"
        );
    }
    return themeConfig;
};
/**
 *
 * @param {*} hexo - hexo 实例
 * @returns {object} themeConfig - 用户定义的主题配置
 * @description - 从_config.hexo-theme-doratiger.yml 中获取用户定义的主题配置
 */
const getRootThemeConfig = (hexo) => {
    let themeConfig = {};
    let filePath = path.join(
        hexo.base_dir,
        "_config.hexo-theme-doratiger1.yml"
    );
    // 读取 _config.hexo-theme-doratiger.yml
    if (fs.existsSync(filePath)) {
        themeConfig = yaml.load(fs.readFileSync(filePath, "utf8"));
    }
    return themeConfig;
};
/**
 *
 * @param {*} hexo - hexo 实例
 * @returns {object} themeConfig - 原始的主题配置
 * @description - 从/themes/hexo-theme-doratiger/_config.yml 中获取主题配置
 */
const getDefaultThemeConfig = (hexo) => {
    let themeConfig = hexo.config.theme_config;
    return themeConfig;
};
/**
 *
 * @param {*} hexo - hexo 实例
 * @returns {Map} langConfigMap - 用户定义的语言配置
 * @description - 从/_data/language/*.yml 中获取用户定义的语言配置
 */
const getDataLangConfig = (hexo) => {
    let langConfigMap = {};
    if (hexo.locals.get instanceof Function) {
        const data = hexo.locals.get("data");
        // 读取 source/_data/languages/ 目录下的所有语言配置文件
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                if (/^languages\/.+$/.test(key)) {
                    langConfigMap[key.replace("languages/", "")] = yaml.load(
                        data[key]
                    );
                }
            }
        }
    }
    return langConfigMap;
};
/**
 *
 * @param {*} hexo - hexo 实例
 * @returns {Map} langConfigMap - 主题默认语言配置
 * @description - 从/themes/hexo-theme-doratiger/languages/*.yml 中获取主题默认语言配置
 */
const getDefaultThemeLangConfig = (hexo) => {
    let langConfigMap = {};
    const langDir = path.join(hexo.theme_dir, "languages");
    const files = fs.readdirSync(langDir);
    files.forEach((file) => {
        const filePath = path.join(langDir, file);
        if (fs.statSync(filePath).isFile()) {
            const lang = path.basename(file, path.extname(file));
            langConfigMap[lang] = yaml.load(fs.readFileSync(filePath, "utf8"));
        }
    });
    return langConfigMap;
};

module.exports = (hexo) => {
    let themeMergeConfig = {};
    let themeMergeI18nData = {};

    // 合并主题配置
    const dataThemeConfig = getDataThemeConfig(hexo);
    const rootThemeConfig = getRootThemeConfig(hexo);
    const defaultThemeConfig = getDefaultThemeConfig(hexo);

    themeMergeConfig = merge({}, defaultThemeConfig);
    if (isNotEmptyObject(dataThemeConfig)) {
        themeMergeConfig = merge({}, themeMergeConfig, dataThemeConfig);
        log(
            hexo,
            "[DoraTiger] 读取 /_data/doratiger_config.yml 文件覆盖配置主题",
            "[DoraTiger] Read /_data/doratiger_config.yml file to override theme configuration",
            "debug"
        );
    }
    if (isNotEmptyObject(rootThemeConfig)) {
        themeMergeConfig = merge({}, themeMergeConfig, rootThemeConfig);
        log(
            hexo,
            "[DoraTiger] 读取 _config.hexo-theme-doratiger.yml 文件覆盖主题配置",
            "[DoraTiger] Read _config.hexo-theme-doratiger.yml file to override theme configuration",
            "debug"
        );
    }

    // 合并主题多语言配置
    const dataLangConfigMap = getDataLangConfig(hexo);
    const defaultLangConfigMap = getDefaultThemeLangConfig(hexo);
    const themeI18nLanguages = hexo.theme.i18n.languages;
    themeMergeI18nData = merge({}, defaultLangConfigMap);
    if (isNotEmptyObject(dataLangConfigMap)) {
        themeMergeI18nData = merge({}, themeMergeI18nData, dataLangConfigMap);
        log(
            hexo,
            "[DoraTiger] 读取 /_data/languages/*.yml 文件覆盖语言配置",
            "[DoraTiger] Read /_data/languages/*.yml file to override language configuration",
            "debug"
        );
    }

    // 设置主题配置
    let doratiger = {
        config: themeMergeConfig,
        i18n: {
            data: themeMergeI18nData,
            languages: themeI18nLanguages,
        },
    };
    hexo.doratiger = doratiger;
};

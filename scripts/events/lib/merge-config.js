"use strict";

const fs = require("fs");
const path = require("path");
const { isNotEmptyObject, merge } = require("../../utils/object");
const log = require("../../utils/log");

module.exports = (hexo) => {
    let themeConfig = hexo.theme.config;

    let themeConfig_root = hexo.config.theme_config;

    let themeConfig_data = {};

    let langConfigMap = {};

    if (hexo.locals.get instanceof Function) {
        const data = hexo.locals.get("data");

        // 读取 source/_data/doratiger_config.yml 文件
        if (data && isNotEmptyObject(data.doratiger_config)) {
            themeConfig_data = data.doratiger_config;
        }

        if (
            (isNotEmptyObject(themeConfig_data) && hexo.version.split(".")[0] >= 5) ||
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

        // 读取 source/_data/languages/ 目录下的所有语言配置文件
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                if (/^languages\/.+$/.test(key)) {
                    langConfigMap[key.replace("languages/", "")] = data[key];
                }
            }
        }
    }

    // 合并多语言配置
    const { language } = hexo.config;
    const { i18n } = hexo.theme;

    if (isNotEmptyObject(langConfigMap)) {
        const mergeLang = (lang) => {
            if (langConfigMap[lang]) {
                i18n.set(
                    lang,
                    merge({}, i18n.get([lang]), langConfigMap[lang])
                );
            }
        };
        if (Array.isArray(language)) {
            for (const lang of language) {
                mergeLang(lang);
            }
        } else {
            mergeLang(language);
        }
        log(
            hexo,
            "[DoraTiger] 读取 source/_data/languages/*.yml 文件覆盖语言配置",
            "[DoraTiger] Read source/_data/languages/*.yml file to override language configuration",
            "debug"
        );
    }

    // 合并根目录主题配置
    if (isNotEmptyObject(themeConfig_root)) {
        themeConfig = merge(
            {},
            themeConfig,
            themeConfig_root
        );
        log(
            hexo,
            "[DoraTiger] 读取 _config.hexo-theme-doratiger.yml 文件覆盖主题配置",
            "[DoraTiger] Read _config.hexo-theme-doratiger.yml file to override theme configuration",
            "debug"
        );
    }

    // 合并数据目录主题配置
    if(isNotEmptyObject(themeConfig_data)) {
        themeConfig = merge({}, themeConfig, themeConfig_data);
        log(
            hexo,
            "[DoraTiger] 读取 source/_data/doratiger_config.yml 文件覆盖主题配置",
            "[DoraTiger] Read source/_data/doratiger_config.yml file to override theme configuration",
            "debug"
        );
    }
};

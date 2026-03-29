"use strict";

const fs = require("fs");
const path = require("path");
const log = require("../../utils/log");
const { getBoolOption } = require("../../utils/args");

const copyConfigIfNeeded = ({
    sourcePath,
    targetPath,
    force,
    hexo,
    zhCreated,
    enCreated,
    zhSkip,
    enSkip,
}) => {
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    if (fs.existsSync(targetPath) && !force) {
        log(hexo, zhSkip + targetPath, enSkip + targetPath, "warn");
        return false;
    }

    fs.copyFileSync(sourcePath, targetPath);
    log(hexo, zhCreated + targetPath, enCreated + targetPath, "info");
    return true;
};

module.exports = (hexo, options = {}, callback) => {
    try {
        const force = getBoolOption(options, ["force", "f"], false);
        const legacy = getBoolOption(options, ["legacy", "l"], false);
        const themeConfigPath = path.join(hexo.theme_dir, "_config.yml");

        if (!fs.existsSync(themeConfigPath)) {
            throw new Error("theme default config not found: " + themeConfigPath);
        }

        const major = parseInt((hexo.version || "0").split(".")[0], 10) || 0;
        const rootTarget = path.join(
            hexo.base_dir,
            "_config.hexo-theme-doratiger.yml"
        );
        const legacyTarget = path.join(
            hexo.source_dir,
            "_data",
            "doratiger_config.yml"
        );

        // Hexo >= 5 推荐根目录独立主题配置；更早版本优先兼容 _data 配置。
        const preferRoot = major >= 5;

        if (preferRoot) {
            copyConfigIfNeeded({
                sourcePath: themeConfigPath,
                targetPath: rootTarget,
                force,
                hexo,
                zhCreated: "[DoraTiger] 已初始化主题配置：",
                enCreated: "[DoraTiger] Theme config initialized: ",
                zhSkip: "[DoraTiger] 目标文件已存在，跳过（可用 --force 覆盖）：",
                enSkip:
                    "[DoraTiger] Target exists, skipped (use --force to overwrite): ",
            });

            if (legacy) {
                copyConfigIfNeeded({
                    sourcePath: themeConfigPath,
                    targetPath: legacyTarget,
                    force,
                    hexo,
                    zhCreated: "[DoraTiger] 已生成兼容配置：",
                    enCreated: "[DoraTiger] Legacy-compatible config generated: ",
                    zhSkip:
                        "[DoraTiger] 兼容配置已存在，跳过（可用 --force 覆盖）：",
                    enSkip:
                        "[DoraTiger] Legacy config exists, skipped (use --force to overwrite): ",
                });
            }

            log(
                hexo,
                "[DoraTiger] 初始化完成。建议编辑根目录 _config.hexo-theme-doratiger.yml",
                "[DoraTiger] Initialization complete. Please edit _config.hexo-theme-doratiger.yml in site root.",
                "info"
            );
        } else {
            copyConfigIfNeeded({
                sourcePath: themeConfigPath,
                targetPath: legacyTarget,
                force,
                hexo,
                zhCreated: "[DoraTiger] 已初始化兼容配置：",
                enCreated: "[DoraTiger] Legacy config initialized: ",
                zhSkip: "[DoraTiger] 目标文件已存在，跳过（可用 --force 覆盖）：",
                enSkip:
                    "[DoraTiger] Target exists, skipped (use --force to overwrite): ",
            });

            if (legacy) {
                copyConfigIfNeeded({
                    sourcePath: themeConfigPath,
                    targetPath: rootTarget,
                    force,
                    hexo,
                    zhCreated: "[DoraTiger] 已额外生成根目录配置：",
                    enCreated:
                        "[DoraTiger] Additional root config generated: ",
                    zhSkip:
                        "[DoraTiger] 根目录配置已存在，跳过（可用 --force 覆盖）：",
                    enSkip:
                        "[DoraTiger] Root config exists, skipped (use --force to overwrite): ",
                });
            }

            log(
                hexo,
                "[DoraTiger] 当前 Hexo 版本较低，优先使用 source/_data/doratiger_config.yml",
                "[DoraTiger] Detected older Hexo version, source/_data/doratiger_config.yml is preferred.",
                "warn"
            );
        }

        callback();
    } catch (error) {
        log(
            hexo,
            "[DoraTiger] themeinit 执行失败：" + error.message,
            "[DoraTiger] themeinit failed: " + error.message,
            "error"
        );
        callback(error);
    }
};

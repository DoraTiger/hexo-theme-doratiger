/* global hexo */

"use strict";

/**
 * 监听 Hexo 的 "ready" 事件，该事件在初始化完成后触发。
 * 可用于扩展 Hexo 的功能或加载额外的插件。
 */
hexo.on("ready", () => {
    require("./lib/themeConfig.js")(hexo);
});

/**
 * 监听 Hexo 的 "processBefore" 事件，该事件在处理原始文件前触发。
 *
 * @param {string} path - 原始文件的根目录路径。
 * 可用于准备原始文件处理的环境或执行预处理操作。
 */
hexo.on("processBefore", (path) => {});

/**
 * 监听 Hexo 的 "processAfter" 事件，该事件在处理原始文件后触发。
 *
 * @param {string} path - 原始文件的根目录路径。
 * 可用于执行处理后的清理操作或分析文件变化。
 */
hexo.on("processAfter", (path) => {});

/**
 * 监听 Hexo 的 "deployBefore" 事件，该事件在部署开始前触发。
 * 可用于在部署前执行初始化操作，如备份、清理或生成额外文件等。
 */
hexo.on("deployBefore", () => {});

/**
 * 监听 Hexo 的 "deployAfter" 事件，该事件在部署完成后触发。
 * 可用于执行部署后的操作，如通知、日志记录或更新额外资源。
 */
hexo.on("deployAfter", () => {});

/**
 * 监听 Hexo 的 "generateBefore" 事件，该事件在生成器开始前触发。
 * 可用于准备生成器所需的环境或执行预处理操作。
 */
hexo.on("generateBefore", () => {
    require("./lib/mergeConfig.js")(hexo);
});

/**
 * 监听 Hexo 的 "generateAfter" 事件，该事件在生成器完成后触发。
 * 可用于对生成的静态文件进行后续处理，如压缩、缓存清理或分析。
 */
hexo.on("generateAfter", () => {
    require("./lib/hello.js")(hexo);
});

/**
 * 监听 Hexo 的 "exit" 事件，该事件在 Hexo 进程退出前触发。
 * 可用于在退出时清理资源、保存状态或执行其他收尾工作。
 */
hexo.on("exit", () => {});

/**
 * 监听 Hexo 的 "new" 事件，该事件在创建新文章时触发。
 *
 * @param {Object} post - 新创建的文章对象，包含以下属性：
 *   - path: 文章的文件路径（字符串）。
 *   - content: 文章的初始内容（字符串）。
 */
hexo.on("new", (post) => {});

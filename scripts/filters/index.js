/* global hexo */

"use strict";

/**
 * 在初始化完成后触发。
 */
hexo.extend.filter.register("after_init", () => {});

/**
 * 在生成器开始前触发。
 */
hexo.extend.filter.register("before_generate", () => {});

/**
 * 在生成器完成后触发。
 */
hexo.extend.filter.register("after_generate", () => {});

/**
 * 在清理操作完成后触发。
 */
hexo.extend.filter.register("after_clean", () => {});

/**
 * 在退出 Hexo 前触发。
 */
hexo.extend.filter.register("before_exit", () => {});

/**
 * 在渲染文章之前触发，用于处理文章数据。
 *
 * @param {Object} data - 文章的数据对象。
 * - data.title 文章标题。
 * - data.slug 文章网址。
 * - data.layout 文章布局。
 * - data.path 文章路径。
 * - data.date 文章日期。
 * - data.content: 文件的内容。
 * @returns {Object} 修改后的数据对象。
 */
hexo.extend.filter.register("before_post_render", (data) => {
    return data;
});

/**
 * 在渲染文章之后触发，用于处理渲染后的文章数据。
 *
 * @param {Object} data - 渲染后的文章数据对象。
 * - data.title 文章标题。
 * - data.slug 文章网址。
 * - data.layout 文章布局。
 * - data.path 文章路径。
 * - data.date 文章日期。
 * - data.content 文章内容。
 * @returns {Object} 修改后的数据对象。
 */
hexo.extend.filter.register("after_post_render", (data) => {
    require("./lib/code")(hexo,data);
    return data;
});

/**
 * 自定义新文章的路径生成规则。
 *
 * @param {Object} data - 包含文章路径和文件名的数据。
 * - data.path: 文章路径。
 * @param {boolean} replace - 是否替换已有文章。
 * - `true`：如果路径已经存在，则覆盖文件。
 * - `false`：如果路径已经存在，则保留现有文件。
 * @returns {Object} 修改后的数据对象。
 */
hexo.extend.filter.register("new_post_path", (data, replace) => {
    return data;
});

/**
 * 自定义文章的永久链接生成规则。
 *
 * @param {Object} data - 文章的数据对象。
 * @returns {Object} 修改后的 permalink 对象，未定义则使用原始值。
 */
hexo.extend.filter.register("post_permalink", (data) => {});

/**
 * 修改模板渲染时的本地变量。
 *
 * @param {Object} locals - 模板渲染时使用的本地变量对象。
 * locals 为指针对象，直接修改就可以增删变量。
 */
hexo.extend.filter.register("template_locals", (locals) => {});

/**
 * 定制 Hexo 内置服务器的中间件。
 *
 * @param {Object} app - Express 应用实例。
 */
hexo.extend.filter.register("server_middleware", (app) => {});

/**
 * 在 JS 文件渲染后触发，用于处理 JS 内容。
 *
 * @param {Object} data - 包含内容的对象。
 * - data.path: 文件的路径。
 * - data.content: 文件的内容。
 * @returns {string} 修改后的文件内容。
 */
hexo.extend.filter.register("after_render:js", (data) => {
    return data.content;
});

/**
 * 在 HTML 文件渲染后触发，用于处理 HTML 内容。
 *
 * @param {string} data - 包含内容的对象。
 * @returns {string} 修改后的文件内容。
 */
hexo.extend.filter.register("after_render:html", (data) => {
    return data;
});

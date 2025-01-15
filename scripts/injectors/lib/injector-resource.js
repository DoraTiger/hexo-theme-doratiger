"use strict";

const { loadResource } = require("../../utils/loadResource.js");

module.exports = (hexo, resourceType = "") => {
    let resources = [];

    switch (resourceType) {
        case "css":
            resources.push(`<link rel="stylesheet" href="/css/main.css">`);
            break;
        case "js":
            resources.push(`<script type="module" src="/js/main.js"></script>`);
            break;
        case "script":
            break;
        default:
            return "";
    }

    const config = hexo.config;
    const theme = config.theme_config || {};
    const resource = theme.resource || {};
    const globalCDN = theme.resource.enable_cdn || false;

    // 单独处理搜索资源
    const search = theme.search || {};
    const search_enable = search.enable || false;
    const search_type = search.type || null;
    if (search_enable && search_type) {
        resources.push(
            loadResource(resource[search_type], resourceType, globalCDN)
        );
    }

    // 单独处理统计资源
    const statistics = theme.statistics || {};
    const statistics_enable = statistics.enable || false;
    const statistics_type = statistics.type || null;
    if (statistics_enable && statistics_type) {
        resources.push(
            loadResource(resource[statistics_type], resourceType, globalCDN)
        );
    }

    // 单独处理评论资源
    const comment = theme.comment || {};
    const comment_enable = comment.enable || false;
    const comment_type = comment.type || null;
    if (comment_enable && comment_type) {
        resources.push(
            loadResource(resource[comment_type], resourceType, globalCDN)
        );
    }

    // 单独处理代码高亮资源
    const highlight = theme.post.highlight || {};
    const highlight_enable = highlight.enable || false;
    const highlight_type = highlight.type || null;
    if (highlight_enable && highlight_type) {
        resources.push(
            loadResource(resource[highlight_type], resourceType, globalCDN)
        );
    }

    // 处理第三方资源
    const thirdpart_resource = theme.thirdpary || {};
    for (let key in thirdpart_resource) {
        resources.push(loadResource(thirdpart_resource[key], resourceType, globalCDN));
    }

    return resources
        .filter((item) => {
            return item != null && item.trim() !== "";
        })
        .join("\n");
};

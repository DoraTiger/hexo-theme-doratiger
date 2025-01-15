"use strict";

const pagination = require("hexo-pagination");

module.exports = function (locals) {
    const config = this.config;
    const posts = locals.posts.sort(config.index_generator.order_by);
    const stickyPosts = posts.data.sort((a, b) => (b.sticky || 0) - (a.sticky || 0));

    const paginationDir = config.pagination_dir || "page";
    const path = config.index_generator.path || "";

    return pagination(path, stickyPosts, {
        format: paginationDir + "/%d/",
        layout: ["index"],
        data: {
            test: 111
        },
        perPage: config.index_generator.per_page,
    });
};

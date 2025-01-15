"use strict";

module.exports = function (locals) {
    const theme_config = this.theme.config;
    if (theme_config.tag.enable !== false) {
        return {
            path: "tags/index.html",
            data: locals,
            layout: ["tags"],
        };
    }
};

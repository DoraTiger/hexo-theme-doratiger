"use strict";

module.exports = function (locals) {
    const theme_config = this.theme.config;
    if (theme_config.category.enable !== false) {
        return {
            path: "categories/index.html",
            data: locals,
            layout: ["categories"],
        };
    }
};

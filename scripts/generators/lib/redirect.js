"use strict";

module.exports = function (locals) {
    const theme_config = this.theme.config;
    if (theme_config.redirect.enable !== false) {
        return {
            path: "redirect/index.html",
            data: locals,
            layout: ["redirect"],
        };
    }
};

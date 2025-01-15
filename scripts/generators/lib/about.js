"use strict";

const fs = require("fs");
const path = require("path");

module.exports = function (locals) {
    const theme_config = this.theme.config;

    if (theme_config.about.enable !== false) {
        return {
            path: "about/index.html",
            data: locals,
            layout: ["post"],
        };
    }
};

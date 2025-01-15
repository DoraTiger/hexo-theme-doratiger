"use strict";

const fs = require("fs");
const path = require("path");

module.exports = function (locals) {
    const theme_config = this.theme.config;

    if (theme_config.page404.enable !== false) {
        return {
            path: "404.html",
            data: locals,
            layout: ["404"],
        };
    }
};

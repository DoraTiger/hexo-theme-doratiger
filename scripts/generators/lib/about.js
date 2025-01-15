"use strict";

const fs = require("fs");
const path = require("path");

module.exports = function (locals) {
    const theme_config = this.theme.config;

    if (theme_config.about.enable !== false) {
        let aboutPage = null;
        locals.pages.forEach((page) => {
            if (page.type === "about") {
                aboutPage = page;
            }
        });
        return {
            path: "about/index.html",
            data: aboutPage,
            layout: ["about"],
        };
    }
};

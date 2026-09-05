"use strict";

function getUrlFor(hexo) {
    const urlFor = hexo.extend.helper.get("url_for");
    if (typeof urlFor !== "function") {
        throw new Error("Hexo url_for helper is unavailable");
    }
    return urlFor.bind(hexo);
}

module.exports = { getUrlFor };

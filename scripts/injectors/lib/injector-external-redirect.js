"use strict";

const { getThemeConfig } = require("../../utils/theme.js");
const { getUrlFor } = require("../../utils/url.js");

module.exports = (hexo) => {
    if (getThemeConfig(hexo).redirect?.enable === false) return "";
    return `<script type="module" src="${getUrlFor(hexo)("/js/utils/externalRedirect.js")}"></script>`;
};

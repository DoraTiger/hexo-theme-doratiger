"use strict";

const { getCdnImageConfig } = require("../../utils/cdn-image-config.js");
const { getUrlFor } = require("../../utils/url.js");

module.exports = (hexo) => {
    const config = getCdnImageConfig(hexo);
    if (!config.enabled || !config.fallbackEnabled) return "";
    const urlFor = getUrlFor(hexo);
    return `<script src="${urlFor("/js/utils/cdnImageFallback.js")}"></script>`;
};

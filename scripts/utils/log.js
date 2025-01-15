"use strict";

module.exports = (hexo, zh = "", en = "", type = "info") => {
    const isZh = hexo.theme.i18n.languages[0].search(/zh-Hans/i) !== -1;
    const message = isZh ? zh : en;
    hexo.log[type](message);
};

'use strict';

module.exports = (hexo) => {
    hexo.extend.helper.register('ai_declaration', require('./lib/ai-declaration'));
    hexo.extend.helper.register('seo_metadata', require('./lib/seo-metadata'));
};

'use strict';

module.exports = (hexo) => {
    hexo.extend.helper.register('ai_declaration', require('./lib/ai-declaration'));
};

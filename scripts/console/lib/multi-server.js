'use strict';
const { serve } = require('../../utils/multi-deploy/server');
const { describe } = require('../../utils/multi-deploy/errors');

module.exports = async (hexo, args = {}) => {
    try { await serve(hexo, args); }
    catch (error) { throw new Error(describe(error, hexo.config.language)); }
};

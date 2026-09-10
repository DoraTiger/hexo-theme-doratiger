'use strict';
const path = require('node:path');
const { read, real, inside, noLinks } = require('./files');
const { fail } = require('./errors');
const { clean } = require('./config');

function readContext(hexo) {
    const file = process.env.DORATIGER_MULTI_CONTEXT;
    if (!file) return {};
    noLinks(file);
    const context = read(file, 'CONTEXT');
    const base = real(hexo.base_dir);
    if (context.schema !== 1 || context.site !== base || real(file) !== path.join(base, '.multi-context.json') || !/^[a-z][a-z0-9_-]{0,47}$/.test(context.target || '')) fail('CONTEXT');
    if (!inside(context.work, base) || read(path.join(context.work, 'owner.json'), 'CONTEXT').base !== context.host) fail('CONTEXT');
    return clean(context.theme);
}
module.exports = { readContext };

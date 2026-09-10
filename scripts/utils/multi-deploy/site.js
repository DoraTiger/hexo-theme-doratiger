'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { merge, load } = require('./config');
const { copy, json, real } = require('./files');
const { cdn } = require('./workspace');
const { fail } = require('./errors');

// The build and preview paths share configuration preparation; only their
// consumers decide whether to produce a publication record or run a server.
function prepare(plan, target, snapshot) {
    // Do not silently route target searches or writes into a shared CI index.
    const index = target.theme.search?.algolia?.index_name;
    if (index && process.env.ALGOLIA_INDEX_NAME && index !== process.env.ALGOLIA_INDEX_NAME) fail('ALGOLIA_ENV');
    const root = path.join(snapshot.run, target.name);
    const site = path.join(root, 'site');
    copy(snapshot.input, site);
    const config = merge(load(path.join(site, '_config.yml')), target.site);
    Object.assign(config, { theme: plan.themeName, source_dir: 'source', public_dir: 'public', render_drafts: false });
    json(path.join(site, '_config.yml'), config);
    const overrides = merge(target.theme, { multi_deploy: { enable: false } });
    const manifest = cdn(plan, target);
    if (manifest) {
        json(path.join(site, '.multi-cdn.json'), manifest);
        overrides.cdn_image = merge(overrides.cdn_image, { manifest_path: '.multi-cdn.json' });
    }
    const context = path.join(site, '.multi-context.json');
    json(context, { schema: 1, target: target.name, site, work: plan.work, host: plan.base, theme: overrides });
    fs.symlinkSync(real(path.join(plan.base, 'node_modules')), path.join(site, 'node_modules'), 'dir');
    const cli = createRequire(path.join(plan.base, 'package.json')).resolve('hexo/bin/hexo');
    return { root, site, config, cli, env: { ...process.env, DORATIGER_MULTI_CONTEXT: context } };
}
module.exports = { prepare };

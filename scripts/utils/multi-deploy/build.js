'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { copy, json, read, tree, digest, inside, noLinks } = require('./files');
const { fingerprint } = require('./workspace');
const { fail } = require('./errors');
const { run } = require('./process');
const { prepare } = require('./site');
const pages = require('./pages');

async function build(plan, target, snapshot) {
    const { root, site, config, cli, env } = prepare(plan, target, snapshot);
    for (const command of ['clean', 'generate']) {
        let result; try { result = await run(process.execPath, [cli, command], site, env); } catch { fail('BUILD'); }
        if (result.status !== 0 || /\b(?:ERROR|FATAL)\b/.test(result.output)) fail('BUILD');
    }
    const output = path.join(site, 'public');
    if (!fs.existsSync(path.join(output, 'index.html'))) fail('BUILD');
    pages.apply(output, path.join(site, 'source'), target.publish?.pages);
    const files = tree(output);
    if (!files.length) fail('BUILD');
    const artifact = path.join(root, 'artifact'); copy(output, artifact);
    if (fingerprint(plan, target) !== snapshot.hashes[target.name]) fail('STALE');
    const record = { schema: 1, target: target.name, created_at: new Date().toISOString(), input: snapshot.hashes[target.name], url: config.url, root: config.root || '/', node: process.version, hexo: plan.hexoVersion, files, treeHash: digest(JSON.stringify(files)) };
    json(path.join(root, 'build.json'), record);
    json(path.join(plan.work, 'latest', `${target.name}.json`), { directory: path.relative(plan.work, root) });
    return { ...record, artifact };
}
function verify(plan, target) {
    const pointer = read(path.join(plan.work, 'latest', `${target.name}.json`), 'ARTIFACT');
    if (typeof pointer.directory !== 'string') fail('ARTIFACT');
    const root = path.resolve(plan.work, pointer.directory);
    if (!inside(path.join(plan.work, 'runs'), root)) fail('ARTIFACT');
    noLinks(root);
    const record = read(path.join(root, 'build.json'), 'ARTIFACT');
    if (record.schema !== 1 || record.target !== target.name) fail('ARTIFACT');
    if (record.input !== fingerprint(plan, target)) fail('STALE');
    const artifact = path.join(root, 'artifact');
    let actual; try { actual = tree(artifact); } catch { fail('ARTIFACT'); }
    if (digest(JSON.stringify(actual)) !== record.treeHash || JSON.stringify(actual) !== JSON.stringify(record.files)) fail('ARTIFACT');
    return { ...record, artifact };
}
module.exports = { build, verify };

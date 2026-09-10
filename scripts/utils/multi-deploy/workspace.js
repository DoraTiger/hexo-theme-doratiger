'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fail } = require('./errors');
const { digest, mkdir, json, read, walk, real, noLinks } = require('./files');
const { merge } = require('./config');
const { getCdnImageConfig } = require('../cdn-image-config');

// Public content may legitimately contain tools/public/ or a JSON database.
// Exclude private metadata at every depth, but scope runtime output to its
// owning project root rather than a content file's basename.
const contentExcluded = name => name.split('/').some(n => ['.git', 'node_modules', '.worktrees', '.deploy_git', '.env', '.multi-context.json'].includes(n) || n.startsWith('.env.'));
function inputs(plan, metadataOnly = false) {
    const entries = [];
    const addFile = (src, name, timestamps = false) => {
        const stat = fs.statSync(src);
        entries.push({ src, name, hash: metadataOnly ? `${stat.ino}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}` : digest(fs.readFileSync(src)), mtime: timestamps ? Math.floor(stat.mtimeMs) : undefined });
    };
    const addTree = (src, dest, exclude = contentExcluded, timestamps = false) => {
        if (!fs.existsSync(src)) return;
        for (const e of walk(src, exclude)) addFile(e.file, `${dest}/${e.name}`, timestamps);
    };
    addTree(plan.source, 'source', contentExcluded, true);
    addTree(plan.theme, `themes/${plan.themeName}`, name => contentExcluded(name) || ['docs', 'tests', 'public', 'db.json'].includes(name.split('/')[0]));
    for (const dir of ['scripts', 'scaffolds']) addTree(path.join(plan.base, dir), dir);
    for (const name of ['_config.yml', '_config.hexo-theme-doratiger.yml', 'package.json', 'package-lock.json']) {
        const file = path.join(plan.base, name);
        if (fs.existsSync(file)) addFile(real(file), name);
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name));
}
function cdn(plan, target) {
    const config = getCdnImageConfig({ base_dir: plan.base, doratiger: { config: merge(plan.themeConfig, target.theme) } });
    if (!config.enabled) return null;
    const manifest = read(config.manifestPath, 'CDN');
    if (manifest.version !== 1 || manifest.provider !== config.provider || manifest.bucket !== config.qiniu.bucket || manifest.publicBaseUrl !== config.publicBaseUrl || !manifest.entries || typeof manifest.entries !== 'object') fail('CDN');
    if (Object.values(manifest.entries).some(e => !e || typeof e.objectKey !== 'string' || !e.objectKey.startsWith(`${config.keyPrefix}/`))) fail('CDN');
    return manifest;
}
function fingerprint(plan, target, entries = inputs(plan)) {
    return digest(JSON.stringify({
        files: entries.map(({ name, hash, mtime }) => ({ name, hash, mtime })),
        target: { name: target.name, config: digest(fs.readFileSync(target.configFile)), publish: target.publish },
        cdn: cdn(plan, target), node: process.version, hexo: plan.hexoVersion,
        env: plan.fingerprintEnv.map(n => [n, process.env[n] ?? null]),
    }));
}
function inspectOwner(plan) {
    noLinks(plan.work);
    if (!fs.existsSync(plan.work)) return false;
    noLinks(path.join(plan.work, 'owner.json'));
    const owner = read(path.join(plan.work, 'owner.json'), 'PATH');
    if (owner.schema !== 1 || owner.base !== plan.base) fail('PATH');
    return true;
}
function inspect(plan) {
    if (!inspectOwner(plan)) return false;
    // Refuse symlinks in any persistent state before following record paths.
    walk(plan.work, name => {
        if (!/^runs\/[^/]+\/[a-z][a-z0-9_-]*\/site\/node_modules$/.test(name)) return false;
        if (real(path.join(plan.work, name)) !== real(path.join(plan.base, 'node_modules'))) fail('PATH');
        return true;
    });
    return true;
}
function acquire(plan) {
    if (!inspect(plan)) {
        mkdir(plan.work); json(path.join(plan.work, 'owner.json'), { schema: 1, base: plan.base });
    }
    const file = path.join(plan.work, 'lock');
    try { fs.writeFileSync(file, JSON.stringify({ pid: process.pid, host: require('node:os').hostname(), started: new Date().toISOString() }), { flag: 'wx', mode: 0o600 }); }
    catch { fail('LOCK'); }
    return () => fs.unlinkSync(file);
}
function snapshot(plan) {
    const run = path.join(plan.work, 'runs', crypto.randomUUID());
    const input = path.join(run, 'input'); mkdir(input);
    const entries = inputs(plan);
    const hashes = Object.fromEntries(plan.targets.map(t => [t.name, fingerprint(plan, t, entries)]));
    for (const e of entries) {
        const dest = path.join(input, e.name); mkdir(path.dirname(dest));
        const stat = fs.statSync(e.src);
        fs.copyFileSync(e.src, dest); fs.chmodSync(dest, stat.mode & 0o111 ? 0o700 : 0o600); fs.utimesSync(dest, stat.atime, stat.mtime);
        if (digest(fs.readFileSync(dest)) !== e.hash) fail('STALE');
    }
    for (const t of plan.targets) if (fingerprint(plan, t) !== hashes[t.name]) fail('STALE');
    return { run, input, hashes };
}
module.exports = { inputs, fingerprint, acquire, snapshot, cdn, inspect, inspectOwner };

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const { getThemeConfig } = require('../theme');
const { fail } = require('./errors');
const { real, inside, noLinks } = require('./files');
const pages = require('./pages');

const object = value => value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
function clean(value) {
    if (Array.isArray(value)) return value.map(clean);
    if (!object(value)) return value;
    const result = {};
    for (const key of Object.keys(value)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) fail('CONFIG');
        result[key] = clean(value[key]);
    }
    return result;
}
function merge(...values) {
    const result = {};
    for (const value of values) for (const [k, v] of Object.entries(clean(value || {}))) result[k] = object(v) && object(result[k]) ? merge(result[k], v) : v;
    return result;
}
function load(file) {
    try { const value = clean(yaml.load(fs.readFileSync(file, 'utf8'))); if (!object(value)) fail('CONFIG'); return value; }
    catch (error) { if (error.multiCode) throw error; fail('CONFIG'); }
}
function destination(publish, base) {
    if (!object(publish) || publish.type !== 'git' || typeof publish.repo !== 'string' || typeof publish.branch !== 'string') fail('CONFIG');
    if (Object.keys(publish).some(k => !['type', 'repo', 'branch', 'message', 'name', 'email', 'token', 'username', 'pages'].includes(k))) fail('CONFIG');
    pages.validate(publish.pages);
    for (const key of ['message', 'name', 'email', 'username']) {
        if (publish[key] !== undefined && (typeof publish[key] !== 'string' || !publish[key].trim() || /[\x00-\x1f\x7f]/.test(publish[key]))) fail('CONFIG');
    }
    if ([publish.name, publish.email].some(v => v && /[<>]/.test(v))) fail('CONFIG');
    if (publish.username && (publish.username.includes(':') || !publish.token)) fail('CONFIG');
    if (publish.token !== undefined && (typeof publish.token !== 'string' || !/^\$[A-Za-z_][A-Za-z0-9_]*$/.test(publish.token) || !publish.repo.startsWith('https://'))) fail('CONFIG');
    const { repo, branch } = publish;
    if (!repo || /[\x00-\x20\x7f]/.test(repo) || repo.startsWith('-') || !branch || branch.startsWith('-') || /[\x00-\x20\x7f]/.test(branch)) fail('CONFIG');
    let normalized = repo;
    if (path.isAbsolute(repo)) normalized = real(repo);
    else if (/^(https|ssh):\/\//.test(repo)) {
        let u; try { u = new URL(repo); } catch { fail('CONFIG'); }
        if (!u.hostname || u.password || u.search || u.hash || (u.protocol === 'https:' && u.username)) fail('CONFIG');
    } else if (!/^(?:[A-Za-z0-9._-]+@)?[A-Za-z0-9.-]+:[A-Za-z0-9_./~-]+$/.test(repo) || repo.includes('::')) fail('CONFIG');
    if (path.isAbsolute(normalized) && (normalized === base || inside(normalized, base))) fail('PATH');
    return { ...publish, type: 'git', repo: normalized, branch };
}
function resolve(hexo, args, maintenance = false, preview = false) {
    const settings = clean(getThemeConfig(hexo).multi_deploy || {});
    if (settings.enable !== true) fail('DISABLED');
    const names = args._ || [];
    if ((args.all && names.length) || (!args.all && names.length !== 1) || args.draft || args.output || args.config) fail('TARGET');
    const table = settings.targets;
    if (!object(table) || !Object.keys(table).length) fail('TARGET');
    const selected = args.all ? Object.keys(table) : names;
    if (selected.some(n => n === 'input' || !/^[a-z][a-z0-9_-]{0,47}$/.test(n) || !Object.hasOwn(table, n))) fail('TARGET');
    const base = real(hexo.base_dir);
    if (typeof hexo.config.theme !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(hexo.config.theme)) fail('PATH');
    const theme = real(hexo.theme_dir);
    const source = real(path.resolve(base, hexo.config.source_dir || 'source'));
    if (!inside(base, source)) fail('PATH');
    const work = path.resolve(base, settings.work_dir || 'plugins/multi_deploy');
    noLinks(work);
    if (!inside(base, work) || [source, theme, path.join(base, 'scripts'), path.join(base, 'scaffolds'), path.join(base, '.git'), path.join(base, 'node_modules'), real(hexo.public_dir)].some(p => work === p || inside(p, work) || inside(work, p))) fail('PATH');
    const cleanup = { keep_builds: 3, keep_records: 20, ...settings.cleanup };
    if ((settings.cleanup !== undefined && !object(settings.cleanup)) || Object.keys(cleanup).some(k => !['keep_builds', 'keep_records'].includes(k) || !Number.isSafeInteger(cleanup[k]) || cleanup[k] < 1)) fail('CONFIG');
    if (maintenance) return { base, work, targets: selected.map(name => ({ name })), cleanup };
    // A preview of A also copies shared source: an unselected B profile must
    // not become a public asset either. Do not load unselected profile values.
    for (const spec of Object.values(table)) if (object(spec) && typeof spec.config === 'string') {
        const file = real(path.resolve(base, spec.config));
        if ([source, path.join(theme, 'source')].some(dir => file === dir || inside(dir, file))) fail('PATH');
    }
    const targets = selected.map(name => {
        const spec = table[name];
        if (!object(spec) || typeof spec.config !== 'string' || Object.keys(spec).some(k => !['config', 'publish'].includes(k))) fail('CONFIG');
        const configFile = real(path.resolve(base, spec.config));
        // Profiles may contain private theme values. Never allow Hexo to
        // treat the selected profile as a publicly served source asset.
        if ([work, source, path.join(theme, 'source')].some(dir => configFile === dir || inside(dir, configFile))) fail('PATH');
        const config = load(configFile);
        if (Object.keys(config).some(k => !['site', 'theme'].includes(k))) fail('CONFIG');
        for (const k of ['site', 'theme']) if (config[k] !== undefined && !object(config[k])) fail('CONFIG');
        const site = config.site || {}, override = config.theme || {};
        if (['theme_config', 'theme', 'deploy', 'source_dir', 'public_dir', 'code_dir', 'i18n_dir'].some(k => Object.hasOwn(site, k)) || Object.hasOwn(override, 'multi_deploy')) fail('CONFIG');
        const effective = merge(load(path.join(base, '_config.yml')), site);
        if (effective.render_drafts === true) fail('CONFIG');
        return { name, configFile, site, theme: override, publish: preview && spec.publish === undefined ? undefined : destination(spec.publish, base) };
    });
    if (new Set(targets.filter(t => t.publish).map(t => `${t.publish.repo}\n${t.publish.branch}`)).size !== targets.filter(t => t.publish).length) fail('CONFIG');
    const fingerprintEnv = settings.fingerprint_env || [];
    if (!Array.isArray(fingerprintEnv) || fingerprintEnv.some(n => typeof n !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(n))) fail('CONFIG');
    return { base, theme, themeName: hexo.config.theme, source, work, targets, cleanup, fingerprintEnv, themeConfig: clean(getThemeConfig(hexo)), hexoVersion: hexo.version };
}
module.exports = { resolve, merge, load, clean };

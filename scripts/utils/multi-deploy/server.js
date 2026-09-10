'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { resolve, load } = require('./config');
const { readMergedThemeConfig } = require('../../events/lib/themeConfig');
const { inputs, fingerprint, cdn, inspectOwner, acquire } = require('./workspace');
const { capture } = require('./server-snapshot');
const { prepare } = require('./site');
const { verify } = require('./build');
const { start } = require('./server-process');
const { json, copy, tree, digest, real } = require('./files');
const { fail, translate } = require('./errors');

function options(args) {
    if (Object.keys(args).some(k => !['_', 'port', 'p', 'ip', 'i', 'static', 'debug', 'silent', 'cwd'].includes(k))) fail('SERVER_ARGS');
    if (args.all || args.force || args.draft || args.output || args.config || args['dry-run'] || args.open || args.o || args.s) fail('SERVER_ARGS');
    const port = args.port ?? args.p ?? 4000;
    const ip = args.ip ?? args.i ?? '127.0.0.1';
    // hexo-server's address formatter does not bracket IPv6 literals.
    if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535 || typeof ip !== 'string' || net.isIP(ip) !== 4) fail('SERVER_ARGS');
    return { port: Number(port), ip, static: !!args.static };
}
function refresh(hexo, args) {
    const config = load(path.join(hexo.base_dir, '_config.yml'));
    if (config.theme !== hexo.config.theme) fail('CONFIG');
    const view = {
        base_dir: hexo.base_dir, theme_dir: hexo.theme_dir, version: hexo.version, config,
        theme: hexo.theme,
        public_dir: path.resolve(hexo.base_dir, config.public_dir || 'public'),
        log: { debug() {}, warn() {}, info() {} },
    };
    view.doratiger = { config: readMergedThemeConfig(view) };
    return resolve(view, args, false, true);
}
function stamp(plan) {
    // Metadata polling avoids repeatedly hashing every article image. A real
    // snapshot still hashes and verifies all inputs before each restart.
    const files = inputs(plan, true).map(e => [e.name, e.hash]);
    const target = plan.targets[0];
    files.push([target.configFile, fs.readFileSync(target.configFile, 'utf8')]);
    files.push(['theme', plan.themeConfig, target.theme]);
    files.push(['cdn', cdn(plan, target)]);
    return digest(JSON.stringify(files));
}
async function checkPort({ port, ip }) {
    const probe = net.createServer();
    await new Promise((resolve, reject) => {
        probe.once('error', () => reject(Object.assign(new Error('MULTI_PORT'), { multiCode: 'PORT' })));
        probe.listen(port, ip, () => probe.close(resolve));
    });
}
async function serve(hexo, args) {
    const opts = options(args);
    let plan = refresh(hexo, args);
    let session, active, stopped = false, wake;
    const stop = () => { stopped = true; if (wake) wake(); if (active) void active.stop(); };
    const pause = () => new Promise(resolve => {
        const timer = setTimeout(done, 1000);
        function done() { clearTimeout(timer); wake = undefined; resolve(); }
        wake = done;
    });
    const reload = () => {
        const next = refresh(hexo, args);
        if (next.base !== plan.base || next.work !== plan.work || next.theme !== plan.theme) fail('CONFIG');
        return next;
    };
    // Hexo CLI's SIGINT listener calls process.exit() without waiting for this
    // command. Own interruption while the server is active so child shutdown
    // and private configuration cleanup finish before CLI teardown.
    const interruptHandlers = process.listeners('SIGINT');
    for (const handler of interruptHandlers) process.removeListener('SIGINT', handler);
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
    try {
        await checkPort(opts);
        session = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-multi-preview-'));
        fs.chmodSync(session, 0o700);
        json(path.join(session, 'owner.json'), { schema: 1, base: plan.base, pid: process.pid });
        let previousRun, observed, retrying = false;
        while (!stopped) {
            const target = plan.targets[0];
            let currentStamp, attempt;
            try {
                currentStamp = stamp(plan);
                attempt = capture(plan, session);
            } catch (error) {
                // Editors can replace files while a snapshot is being read.
                // Only a live input race is retryable; configuration, build,
                // permission and static-artifact failures remain fatal.
                if (opts.static || (error.multiCode !== 'STALE' && error.code !== 'ENOENT')) throw error;
                if (!retrying) hexo.log.info(`[multi-server] ${target.name}: ${translate('WAITING_INPUT', hexo.config.language)}`);
                retrying = true;
                await pause();
                if (!stopped) plan = reload();
                continue;
            }
            retrying = false;
            const { plan: previewPlan, input } = attempt;
            const prepared = prepare(previewPlan, target, input);
            if (opts.static) {
                if (!inspectOwner(plan)) fail('ARTIFACT');
                const release = acquire(plan);
                try {
                    const artifact = verify(plan, target);
                    copy(artifact.artifact, path.join(prepared.site, 'public'));
                    if (digest(JSON.stringify(tree(path.join(prepared.site, 'public')))) !== artifact.treeHash) fail('ARTIFACT');
                    if (fingerprint(plan, target) !== input.hashes[target.name]) fail('STALE');
                } finally { release(); }
            }
            if (stopped) break;
            if (active) await active.stop();
            if (stopped) break;
            if (previousRun) fs.rmSync(previousRun, { recursive: true });
            previousRun = attempt.work;
            active = start(prepared, opts);
            await active.ready;
            const host = net.isIP(opts.ip) === 6 ? `[${opts.ip}]` : opts.ip;
            const root = prepared.config.root || '/';
            hexo.log.info(`[multi-server] ${target.name}: ${translate(opts.static ? 'SERVING_STATIC' : 'SERVING', hexo.config.language)} http://${host}:${opts.port}${root}`);
            observed = currentStamp;
            let closed = false;
            active.closed.then(() => { closed = true; if (wake) wake(); });
            while (!stopped) {
                await pause();
                if (stopped) break;
                if (closed) fail('SERVER');
                if (opts.static) continue;
                const nextPlan = reload();
                let changed;
                try { changed = stamp(nextPlan) !== observed; }
                catch (error) { if (error.code !== 'ENOENT') throw error; changed = true; }
                if (changed) {
                    plan = nextPlan;
                    hexo.log.info(`[multi-server] ${target.name}: ${translate('RESTARTING', hexo.config.language)}`);
                    break;
                }
            }
        }
    } catch (error) {
        if (!stopped) throw error;
    } finally {
        stopped = true;
        if (active) await active.stop();
        process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
        for (const handler of interruptHandlers) process.on('SIGINT', handler);
        // Only this invocation's mkdtemp directory is removed. It never owns
        // source files, saved publication records, or another preview session.
        if (session && real(session) === session) fs.rmSync(session, { recursive: true, force: true });
    }
}
module.exports = { serve };

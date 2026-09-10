'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');

const host = process.env.HEXO_HOST_DIR || path.resolve(__dirname, '../../..');
const theme = path.resolve(__dirname, '..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-multi-server-test-'));
const site = path.join(root, 'site');
const work = path.join(site, 'plugins/multi_deploy');
const children = new Set();
const allHandles = [];
const allLogs = [];
const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.test', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.test' };
delete env.MULTI_SERVER_MISSING_TOKEN;
const privateSentinel = 'PRIVATE-MULTI-SERVER-CONFIG-SENTINEL';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const write = (name, value) => {
    const file = path.join(site, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
};
function launch(args, bin = process.execPath) {
    const child = spawn(bin, bin === process.execPath ? [path.join(host, 'node_modules/hexo/bin/hexo'), ...args] : args, {
        cwd: site, env, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'],
    });
    const handle = { child, args: [bin, ...args], started: Date.now(), output: '', closed: false };
    children.add(handle);
    allHandles.push(handle);
    const collect = data => { handle.output += data; assert.ok(handle.output.length < 8 * 1024 * 1024, 'bounded CLI output'); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    handle.result = new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (status, signal) => {
            handle.closed = true;
            Object.assign(handle, { status, signal, finished: Date.now() });
            children.delete(handle);
            allLogs.push(handle.output);
            resolve({ status, signal, output: handle.output });
        });
    });
    // A startup error can arrive while readiness is being polled. Retain its
    // original rejection for run(), without an unhandled-rejection side exit.
    handle.result.catch(() => {});
    return handle;
}
async function until(check, label, timeout = 20000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const result = await check();
        if (result) return result;
        await delay(150);
    }
    throw new Error(`${label} timed out after ${timeout} ms`);
}
function safeLog(text) {
    return String(text).replace(/PRIVATE[-A-Z0-9]*SENTINEL/g, '[REDACTED]')
        .replaceAll(root, '<fixture>').replaceAll(host, '<hexo-host>').replaceAll(theme, '<theme>');
}
function diagnostics() {
    return allHandles.map(handle => {
        const status = JSON.stringify({ pid: handle.child.pid, closed: handle.closed, status: handle.status, signal: handle.signal,
            elapsed_ms: (handle.finished || Date.now()) - handle.started, at_failure: handle.atFailure });
        return `${safeLog(handle.args.join(' '))}\n${status}\n${safeLog(handle.output).slice(-8192)}`;
    }).join('\n\n').slice(-65536);
}
async function run(args, bin = process.execPath) {
    const handle = launch(args, bin);
    await until(() => handle.closed, `${args.join(' ')} exits`, 60000);
    return handle.result;
}
function ok(result) {
    assert.equal(result.status, 0, result.output);
    assert.doesNotMatch(result.output, /\b(?:ERROR|FATAL)\b/);
    return result;
}
function fails(result, code = 'MULTI_') {
    assert.notEqual(result.status, 0, result.output);
    assert.match(result.output, new RegExp(code));
    assert.doesNotMatch(result.output, new RegExp(privateSentinel));
}
async function freePort() {
    const server = net.createServer();
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    return port;
}
async function request(port, route = '/') {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, { signal: AbortSignal.timeout(2000), cache: 'no-store' });
    return { status: response.status, body: Buffer.from(await response.arrayBuffer()) };
}
async function page(handle, port, route, predicate, label, timeout = 20000) {
    let lastResponse = 'no HTTP response';
    try {
        return await until(async () => {
            assert.equal(handle.closed, false, `preview exited early (pid ${handle.child.pid}, status ${handle.status}, signal ${handle.signal}): ${safeLog(handle.output).slice(-8192)}`);
            let response;
            try { response = await request(port, route); }
            catch (error) { lastResponse = `${error.message} (${error.cause?.code || error.code || 'unknown'})`; return false; }
            lastResponse = `HTTP ${response.status}, ${response.body.length} bytes`;
            return predicate(response) && response;
        }, label, timeout);
    } catch (error) {
        throw new Error(`${error.message}\nRequest ${route}: ${lastResponse}`, { cause: error });
    }
}
function owners(pid) {
    return fs.readdirSync(os.tmpdir()).filter(name => name.startsWith('doratiger-multi-preview-')).flatMap(name => {
        const dir = path.join(os.tmpdir(), name);
        try {
            const owner = JSON.parse(fs.readFileSync(path.join(dir, 'owner.json'), 'utf8'));
            return owner.schema === 1 && owner.base === site && owner.pid === pid ? [dir] : [];
        } catch { return []; }
    });
}
async function stop(handle, port, signal = 'SIGTERM') {
    const owned = owners(handle.child.pid);
    assert.ok(owned.length > 0, 'running preview has an identifiable private session');
    for (const dir of owned) assert.equal(fs.statSync(dir).mode & 0o777, 0o700);
    handle.child.kill(signal);
    await until(() => handle.closed, `${signal} completes session`, 10000);
    await until(async () => { try { await request(port); return false; } catch { return true; } }, `${signal} releases listening port`, 10000);
    for (const dir of owned) assert.equal(fs.existsSync(dir), false, `${signal} removes only its owned preview session`);
    assert.doesNotMatch(handle.output, new RegExp(privateSentinel));
}
function snapshot(dir) {
    if (!fs.existsSync(dir)) return [];
    const result = [];
    const visit = current => {
        for (const name of fs.readdirSync(current).sort()) {
            const file = path.join(current, name);
            const stat = fs.lstatSync(file);
            if (stat.isDirectory()) visit(file);
            else result.push([path.relative(dir, file), stat.isSymbolicLink() ? `link:${fs.readlinkSync(file)}` : crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]);
        }
    };
    visit(dir);
    return result;
}
const article = body => `---\ntitle: review\ndate: 2026-09-09\n---\n## Shared content\n\n${body}\n`;
const siteConfig = { title: 'Base fixture', author: 'BASE-AUTHOR-ONE', url: 'https://base.example.test', theme: 'hexo-theme-doratiger', language: 'en', permalink: ':title/', skip_render: ['tools/**'], include: ['.nojekyll', 'tools/public/.env*'], exclude: ['tools/excluded.txt'] };
const standalone = {
    'tools/public/index.html': '<!doctype html><title>Independent tool</title><p>RAW-TOOL</p>',
    'tools/public/app.js': 'window.fixture = "RAW-JAVASCRIPT";',
    'tools/public/app.css': 'body { color: #123456; }',
    'tools/db.json': '{"publicData":true}',
    '.nojekyll': '',
};
const globalProfile = { site: { title: 'Global fixture', url: 'https://global.example.test', root: '/' }, theme: { comment: { enable: true }, footer: { beian: { miit: { enable: false }, mps: { enable: false } } } } };
const themeConfig = {
    resource: { enable_cdn: false }, statistics: { enable: false },
    search: { enable: true, type: 'local', local: { content: true } },
    private_fixture_key: privateSentinel,
    comment: { enable: false, type: 'twikoo', twikoo: { envId: 'https://comments.example.test' } },
    sidebar: { info: { user: 'PUBLIC-AUTHOR-ONE' } },
    footer: { beian: { miit: { enable: true, text: 'FIXTURE-MIIT' }, mps: { enable: true, text: 'FIXTURE-MPS' } } },
    multi_deploy: { enable: false, cleanup: { keep_builds: 1, keep_records: 1 }, targets: {
        global: { config: 'doratiger_config.global.yml' },
        cn: { config: 'doratiger_config.cn.yml', publish: { type: 'git', repo: 'https://git.example.test/site.git', branch: 'pages', token: '$MULTI_SERVER_MISSING_TOKEN' } },
    } },
};

(async () => {
    try {
        fs.mkdirSync(path.join(site, 'themes'), { recursive: true });
        fs.symlinkSync(path.join(host, 'node_modules'), path.join(site, 'node_modules'));
        fs.symlinkSync(theme, path.join(site, 'themes/hexo-theme-doratiger'));
        write('package.json', fs.readFileSync(path.join(host, 'package.json'), 'utf8'));
        write('package-lock.json', fs.readFileSync(path.join(host, 'package-lock.json'), 'utf8'));
        write('_config.yml', siteConfig);
        write('_config.hexo-theme-doratiger.yml', themeConfig);
        write('doratiger_config.global.yml', globalProfile);
        write('doratiger_config.cn.yml', { site: { title: 'CN fixture', url: 'https://cn.example.test', root: '/blog/' }, theme: { comment: { enable: false } } });
        write('source/_posts/review.md', article('ARTICLE-VERSION-ONE'));
        write('source/fixture.txt', 'STATIC-ASSET-ONE');
        for (const [name, content] of Object.entries(standalone)) write(`source/${name}`, content);
        write('source/tools/excluded.txt', 'EXCLUDED-ASSET');
        write('source/tools/public/.env', privateSentinel);
        write('source/tools/public/.env.production', privateSentinel);
        write('source/_drafts/private.md', '---\ntitle: private\n---\nPRIVATE-DRAFT-SENTINEL');
        write('public/user-owned.txt', 'PRESERVE-HOST-PUBLIC');
        const originalPublic = snapshot(path.join(site, 'public'));
        const result = await run(['--help']);
        assert.equal(result.status, 0, result.output);
        assert.match(result.output, /multi-server/, 'multi-server must be available through the real Hexo CLI before enable checks');
        fails(await run(['multi-server', 'global']), 'MULTI_DISABLED');
        themeConfig.multi_deploy.enable = true;
        write('_config.hexo-theme-doratiger.yml', themeConfig);
        for (const args of [[], ['unknown'], ['--all'], ['global', 'cn'], ['global', '--draft'], ['global', '--force'], ['global', '--output', 'elsewhere'], ['global', '--config', '_config.yml'], ['global', '--port', '0'], ['global', '--port', '65536'], ['global', '--port', 'nonsense'], ['global', '--ip', 'not-an-ip'], ['global', '--unexpected-option']]) {
            fails(await run(['multi-server', ...args]));
        }
        fails(await run(['multi-server', 'global', '--ip', '::1']), 'MULTI_SERVER_ARGS');
        // Reject every publicly routable profile, even if it belongs to another target.
        write('source/private-profile.yml', { theme: { private_fixture_key: privateSentinel } });
        const originalCnConfig = themeConfig.multi_deploy.targets.cn.config;
        for (const unsafe of ['source/private-profile.yml', path.join(theme, 'source/js/layout/header.js')]) {
            themeConfig.multi_deploy.targets.cn.config = unsafe;
            write('_config.hexo-theme-doratiger.yml', themeConfig);
            fails(await run(['multi-server', 'global']), 'MULTI_PATH');
        }
        themeConfig.multi_deploy.targets.cn.config = originalCnConfig;
        write('_config.hexo-theme-doratiger.yml', themeConfig);
        fs.unlinkSync(path.join(site, 'source/private-profile.yml'));
        const p1 = await freePort();
        let p2 = await freePort();
        while (p1 === p2) p2 = await freePort();
        fails(await run(['multi-server', 'global', '--static', '--port', String(p1)]), 'MULTI_ARTIFACT');
        assert.equal(fs.existsSync(work), false, 'preview validation must not initialize publishing state');
        console.log('PASS registration, option validation, no implicit static generation');

        // A preview without publish settings and one with a missing Git token both work.
        const global = launch(['multi-server', 'global', '--port', String(p1)]);
        const cn = launch(['multi-server', 'cn', '--port', String(p2), '--ip', '127.0.0.1']);
        const [globalPage, cnPage] = await Promise.all([
            page(global, p1, '/review/', r => r.status === 200 && r.body.includes('ARTICLE-VERSION-ONE'), 'global live preview startup', 30000),
            page(cn, p2, '/blog/review/', r => r.status === 200 && r.body.includes('ARTICLE-VERSION-ONE'), 'cn subpath preview startup', 30000),
        ]);
        assert.match(globalPage.body.toString(), /Global fixture/);
        assert.match(globalPage.body.toString(), /https:\/\/global\.example\.test/);
        assert.match(globalPage.body.toString(), /id="comment-container"/);
        assert.doesNotMatch(globalPage.body.toString(), /FIXTURE-MIIT|FIXTURE-MPS|PRIVATE-DRAFT-SENTINEL/);
        assert.match(cnPage.body.toString(), /CN fixture/);
        assert.match(cnPage.body.toString(), /FIXTURE-MIIT/);
        assert.doesNotMatch(cnPage.body.toString(), /id="comment-container"/);
        assert.equal((await request(p1, '/private/')).status, 404);
        assert.equal((await request(p1, '/fixture.txt')).body.toString(), 'STATIC-ASSET-ONE');
        for (const [name, content] of Object.entries(standalone)) {
            for (const [port, prefix] of [[p1, '/'], [p2, '/blog/']]) {
                const asset = await request(port, prefix + name);
                assert.equal(asset.status, 200, `source/${name} must survive the input snapshot`);
                assert.equal(asset.body.toString(), content, `source/${name} must retain its raw bytes`);
            }
        }
        for (const name of ['tools/excluded.txt', 'tools/public/.env', 'tools/public/.env.production', 'user-owned.txt']) {
            assert.equal((await request(p1, '/' + name)).status, 404, `${name} must not become a public route`);
        }
        assert.match((await request(p1, '/search.json')).body.toString(), /ARTICLE-VERSION-ONE/);
        assert.equal(fs.existsSync(work), false, 'live preview does not write build or publication state');
        assert.deepEqual(snapshot(path.join(site, 'public')), originalPublic);
        assert.equal(fs.existsSync(path.join(site, 'db.json')), false, 'parent Hexo must not save a host database');

        write('source/_posts/review.md', article('ARTICLE-VERSION-TWO'));
        write('source/fixture.txt', 'STATIC-ASSET-TWO');
        await Promise.all([
            page(global, p1, '/review/', r => r.status === 200 && r.body.includes('ARTICLE-VERSION-TWO') && !r.body.includes('ARTICLE-VERSION-ONE'), 'updated source global'),
            page(cn, p2, '/blog/review/', r => r.status === 200 && r.body.includes('ARTICLE-VERSION-TWO'), 'updated source cn'),
        ]);
        await page(global, p1, '/fixture.txt', r => r.status === 200 && r.body.toString() === 'STATIC-ASSET-TWO', 'static source asset is refreshed');
        write('source/_posts/new.md', '---\ntitle: new\ndate: 2026-09-09\n---\nNEW-ARTICLE-CONTENT');
        await page(global, p1, '/new/', r => r.status === 200 && r.body.includes('NEW-ARTICLE-CONTENT'), 'new source is rendered');
        fs.unlinkSync(path.join(site, 'source/_posts/new.md'));
        await page(global, p1, '/new/', r => r.status === 404, 'deleted source loses its route');
        siteConfig.author = 'BASE-AUTHOR-TWO';
        write('_config.yml', siteConfig);
        await page(global, p1, '/review/', r => r.status === 200 && r.body.includes('BASE-AUTHOR-TWO'), 'root configuration is reloaded');
        themeConfig.sidebar.info.user = 'PUBLIC-AUTHOR-TWO';
        write('_config.hexo-theme-doratiger.yml', themeConfig);
        await page(global, p1, '/review/', r => r.status === 200 && r.body.includes('PUBLIC-AUTHOR-TWO'), 'public theme configuration is reloaded');
        globalProfile.site.title = 'Global fixture revised';
        globalProfile.theme.comment.enable = false;
        write('doratiger_config.global.yml', globalProfile);
        await page(global, p1, '/review/', r => r.status === 200 && r.body.includes('Global fixture revised') && !r.body.includes('id="comment-container"'), 'target profile is reloaded');
        assert.match((await request(p2, '/blog/review/')).body.toString(), /CN fixture/);
        await stop(global, p1, 'SIGINT');
        await page(cn, p2, '/blog/review/', r => r.status === 200 && r.body.includes('CN fixture'), 'other target survives first target shutdown');
        await stop(cn, p2);
        assert.deepEqual(snapshot(path.join(site, 'public')), originalPublic);
        assert.equal(fs.existsSync(path.join(site, 'db.json')), false);
        assert.equal(fs.existsSync(work), false);
        console.log('PASS concurrent target isolation, source CRUD, config reload, signal cleanup');

        // Real editors save repeatedly and may atomically replace an article.
        // A moderate binary asset widens the real snapshot window; no production
        // hooks are mocked, and the writer settles before the readiness deadline.
        const padding = path.join(site, 'source/burst-padding.bin');
        fs.writeFileSync(padding, Buffer.alloc(32 * 1024 * 1024, 1));
        const burst = launch(['multi-server', 'global', '--port', String(p1)]);
        await page(burst, p1, '/review/', r => r.status === 200 && r.body.includes('ARTICLE-VERSION-TWO'), 'continuous-save fixture startup', 30000);
        let saving = true;
        const duringSaves = [];
        const availability = (async () => {
            while (saving && !burst.closed) {
                try { duringSaves.push((await request(p1, '/review/')).status); }
                catch { duringSaves.push('unreachable'); }
                await delay(100);
            }
        })();
        const burstDeadline = Date.now() + 2500;
        let revision = 0;
        while (Date.now() < burstDeadline && !burst.closed) {
            const content = article(`BURST-REVISION-${revision++}`);
            if (revision % 2) write('source/_posts/review.md', content);
            else {
                const staging = path.join(root, 'article-staging.md');
                fs.writeFileSync(staging, content);
                fs.renameSync(staging, path.join(site, 'source/_posts/review.md'));
            }
            await delay(12);
        }
        saving = false;
        await availability;
        if (!burst.closed) assert.ok(duringSaves.length > 1 && duringSaves.every(status => status === 200), `existing preview must remain available while saves are unsettled: ${JSON.stringify(duringSaves)}`);
        write('source/_posts/review.md', article('BURST-FINAL-CONTENT'));
        await page(burst, p1, '/review/', r => r.status === 200 && r.body.includes('BURST-FINAL-CONTENT'), 'continuous and atomic saves settle without terminating preview');
        await stop(burst, p1);
        fs.unlinkSync(padding);
        console.log('PASS continuous and atomic source saves settle without terminating preview');

        const occupied = http.createServer((_req, res) => res.end('USER-OWNED-SERVICE'));
        await new Promise(resolve => occupied.listen(p1, '127.0.0.1', resolve));
        try {
            fails(await run(['multi-server', 'global', '--port', String(p1)]));
            assert.equal((await request(p1)).body.toString(), 'USER-OWNED-SERVICE', 'occupied port must never terminate the existing service');
        } finally { await new Promise(resolve => occupied.close(resolve)); }

        const invalid = launch(['multi-server', 'global', '--port', String(p1)]);
        await page(invalid, p1, '/', r => r.status === 200, 'reload failure fixture startup', 30000);
        const invalidOwned = owners(invalid.child.pid);
        assert.ok(invalidOwned.length);
        write('doratiger_config.global.yml', `site:\n  title: [${privateSentinel}\n`);
        await until(() => invalid.closed, 'invalid reload shuts down instead of serving stale config');
        fails(await invalid.result, 'MULTI_CONFIG');
        for (const dir of invalidOwned) assert.equal(fs.existsSync(dir), false);
        await until(async () => { try { await request(p1); return false; } catch { return true; } }, 'invalid reload releases port');
        write('doratiger_config.global.yml', globalProfile);
        console.log('PASS occupied port protection and fail-closed sanitized reload');

        const changedTheme = launch(['multi-server', 'global', '--port', String(p1)]);
        await page(changedTheme, p1, '/', r => r.status === 200, 'theme-change rejection fixture startup', 30000);
        const changedThemeOwned = owners(changedTheme.child.pid);
        write('_config.yml', { ...siteConfig, theme: 'other-theme' });
        await until(() => changedTheme.closed, 'changing theme terminates the old theme preview');
        fails(await changedTheme.result, 'MULTI_CONFIG');
        for (const dir of changedThemeOwned) assert.equal(fs.existsSync(dir), false);
        write('_config.yml', siteConfig);
        // Exercise a real Hexo filter failure: its private diagnostic must not escape the child.
        write('scripts/preview-failure.js', `hexo.extend.filter.register('before_post_render', () => { throw new Error('${privateSentinel}'); });\n`);
        fails(await run(['multi-server', 'global', '--port', String(p1)]), 'MULTI_SERVER');
        fs.unlinkSync(path.join(site, 'scripts/preview-failure.js'));
        console.log('PASS theme-change rejection and sanitized actual Hexo render failure');

        // A slow real render keeps startup in progress while cancellation is exercised.
        write('scripts/slow-preview.js', "hexo.extend.filter.register('before_post_render', data => new Promise(resolve => setTimeout(() => resolve(data), 2500)));\n");
        for (const signal of ['SIGTERM', 'SIGINT']) {
            const interrupted = launch(['multi-server', 'global', '--port', String(p1)]);
            await until(() => owners(interrupted.child.pid).length, 'startup owns a temporary session', 10000);
            await assert.rejects(request(p1), 'slow startup has not opened its HTTP listener');
            await stop(interrupted, p1, signal);
            ok(await interrupted.result);
        }
        fs.unlinkSync(path.join(site, 'scripts/slow-preview.js'));
        console.log('PASS startup cancellation cleans the child and temporary session');

        // Static preview consumes a separately generated, verified artifact; never a host public directory.
        const bare = path.join(root, 'pages.git');
        ok(await run(['init', '--bare', bare], 'git'));
        themeConfig.multi_deploy.targets.global.publish = { type: 'git', repo: bare, branch: 'pages' };
        write('_config.hexo-theme-doratiger.yml', themeConfig);
        ok(await run(['multi-generate', 'global']));
        const latestFile = path.join(work, 'latest/global.json');
        const latestBefore = fs.readFileSync(latestFile);
        const pointer = JSON.parse(latestBefore);
        const artifactFile = path.join(work, pointer.directory, 'artifact/review/index.html');
        const artifactBefore = fs.readFileSync(artifactFile);
        for (const [name, content] of Object.entries(standalone)) {
            assert.equal(fs.readFileSync(path.join(work, pointer.directory, 'artifact', name), 'utf8'), content);
        }
        const stateBefore = snapshot(work);
        const staticServer = launch(['multi-server', 'global', '--static', '--port', String(p1)]);
        const renderedStatic = await page(staticServer, p1, '/review/', r => r.status === 200, 'static preview startup', 30000);
        assert.deepEqual(renderedStatic.body, artifactBefore, 'static response must equal saved artifact bytes');
        for (const [name, content] of Object.entries(standalone)) {
            const response = await request(p1, '/' + name);
            // The deployment marker is in the artifact (checked above), but
            // upstream hexo-server's serve-static hides dotfiles by default.
            if (name === '.nojekyll') assert.equal(response.status, 404);
            else {
                assert.equal(response.status, 200);
                assert.equal(response.body.toString(), content, `static preview must serve ${name}`);
            }
        }
        assert.deepEqual(snapshot(work), stateBefore, 'static startup must not change latest, records or build artifacts');
        write('source/_posts/review.md', article('ARTICLE-VERSION-THREE'));
        assert.deepEqual((await request(p1, '/review/')).body, artifactBefore, 'static preview remains a frozen release');
        ok(await run(['multi-generate', 'global']));
        ok(await run(['multi-clean', 'global', '--apply', '--yes']));
        assert.equal(fs.existsSync(artifactFile), false, 'old generated release is eligible for normal cleanup');
        assert.deepEqual((await request(p1, '/review/')).body, artifactBefore, 'active static preview survives old artifact cleanup');
        await stop(staticServer, p1);
        assert.equal(fs.existsSync(path.join(work, 'history')), false, 'preview and generation never record a publication');
        const newest = JSON.parse(fs.readFileSync(latestFile));
        const newestArtifact = path.join(work, newest.directory, 'artifact/review/index.html');
        const newestBytes = fs.readFileSync(newestArtifact);
        const newestState = snapshot(work);
        fs.appendFileSync(newestArtifact, 'TAMPERED');
        fails(await run(['multi-server', 'global', '--static', '--port', String(p1)]), 'MULTI_ARTIFACT');
        fs.writeFileSync(newestArtifact, newestBytes);
        write('source/_posts/review.md', article('STALE-UNBUILT-SOURCE'));
        fails(await run(['multi-server', 'global', '--static', '--port', String(p1)]), 'MULTI_STALE');
        assert.deepEqual(snapshot(work), newestState, 'rejected static preview never rebuilds or rewrites state');
        assert.deepEqual(snapshot(path.join(site, 'public')), originalPublic);
        assert.equal(fs.existsSync(path.join(site, 'db.json')), false);
        assert.doesNotMatch(allLogs.join('\n'), new RegExp(privateSentinel));
        assert.equal(fs.readdirSync(os.tmpdir()).filter(n => n.startsWith('doratiger-multi-preview-')).some(n => {
            try { return JSON.parse(fs.readFileSync(path.join(os.tmpdir(), n, 'owner.json'))).base === site; } catch { return false; }
        }), false, 'no fixture-owned preview sessions leak after exits or failures');
        console.log('PASS verified static bytes, frozen release, parallel cleanup, stale/tamper refusal');
        console.log('PASS multi-server real Hexo CLI integration');
    } catch (error) {
        for (const handle of allHandles) handle.atFailure = { closed: handle.closed, status: handle.status, signal: handle.signal, elapsed_ms: Date.now() - handle.started };
        throw error;
    } finally {
        for (const handle of children) {
            try { handle.child.kill('SIGTERM'); } catch { /* already gone */ }
        }
        let cleanupTimer;
        try {
            await Promise.race([
                Promise.allSettled([...children].map(handle => handle.result)),
                new Promise(resolve => { cleanupTimer = setTimeout(resolve, 10000); }),
            ]);
        } finally { clearTimeout(cleanupTimer); }
        for (const handle of children) {
            try { if (process.platform !== 'win32') process.kill(-handle.child.pid, 'SIGKILL'); else handle.child.kill('SIGKILL'); } catch { /* already gone */ }
        }
        if (process.env.MULTI_KEEP_FIXTURE) console.log(`Fixture retained: ${root}`);
        else fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => {
    console.error(safeLog(error.stack || error));
    console.error(`Bounded CLI diagnostics (fixture secrets redacted):\n${diagnostics()}`);
    process.exitCode = 1;
});

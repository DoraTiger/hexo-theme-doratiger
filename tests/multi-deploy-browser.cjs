'use strict';
// Consume the actual local bare repositories produced by multi-deploy.test.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const fixture = process.argv[2];
assert.ok(fixture && path.isAbsolute(fixture), 'Provide the retained fixture root');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-browser-'));
const pause = ms => new Promise(r => setTimeout(r, ms));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
(async () => {
    let chrome, ws;
    const pending = new Map();
    const server = http.createServer((req, res) => {
        let name; try { name = decodeURIComponent(new URL(req.url, 'http://local').pathname); } catch { res.writeHead(400).end(); return; }
        let file = path.resolve(root, `.${name}`);
        if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
    });
    try {
        for (const name of ['cn', 'global']) {
            const result = spawnSync('git', ['clone', '--branch', 'pages', path.join(fixture, `${name}.git`), path.join(root, name)], { encoding: 'utf8' });
            assert.equal(result.status, 0, result.stderr);
        }
        await new Promise(r => server.listen(0, '127.0.0.1', r));
        const base = `http://127.0.0.1:${server.address().port}`;
        chrome = spawn(process.env.CHROMIUM || '/usr/bin/chromium', ['--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${root}/profile`, 'about:blank'], { stdio: 'ignore' });
        const portFile = path.join(root, 'profile/DevToolsActivePort');
        for (let n = 0; n < 100 && !fs.existsSync(portFile); n++) await pause(100);
        const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
        const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
        ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
        await new Promise(r => ws.addEventListener('open', r, { once: true }));
        let id = 0, active = 'cn', loads = 0;
        const exceptions = [], requests = [];
        const call = (method, params = {}) => new Promise((resolve, reject) => {
            const key = ++id;
            const timer = setTimeout(() => { pending.delete(key); reject(Error(method)); }, 15000);
            pending.set(key, { resolve, reject, timer }); ws.send(JSON.stringify({ id: key, method, params }));
        });
        ws.addEventListener('message', e => {
            const m = JSON.parse(e.data), job = pending.get(m.id);
            if (job) { clearTimeout(job.timer); pending.delete(m.id); m.error ? job.reject(m.error) : job.resolve(m.result); }
            if (m.method === 'Page.loadEventFired') loads++;
            if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails);
            if (m.method === 'Fetch.requestPaused') {
                const { requestId, request } = m.params;
                requests.push({ target: active, url: request.url });
                if (request.url.startsWith('https://comments.example.test')) {
                    // Exercise the actual bundled Twikoo UI against read-only
                    // protocol responses; no request reaches a comment service.
                    const event = request.postData ? JSON.parse(request.postData).event : null;
                    if (event && !['GET_CONFIG', 'GET_PASSWORD_STATUS', 'COMMENT_GET', 'GET_COMMENTS_COUNT'].includes(event)) {
                        exceptions.push({ unexpectedCommentEvent: event });
                        call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
                    } else call('Fetch.fulfillRequest', {
                        requestId, responseCode: 200,
                        responseHeaders: [
                            { name: 'Content-Type', value: 'application/json' },
                            { name: 'Access-Control-Allow-Origin', value: base },
                            { name: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
                            { name: 'Access-Control-Allow-Headers', value: 'content-type' },
                        ],
                        body: Buffer.from(JSON.stringify({ code: 0, config: { VERSION: '1.6.40', IS_ADMIN: false }, data: [], count: 0, more: false, version: '1.6.40', status: false })).toString('base64'),
                    }).catch(() => {});
                } else if (request.url.startsWith(base + '/')) {
                    const u = new URL(request.url);
                    // Root-relative resources resolve against the selected site's clone.
                    const url = u.pathname.startsWith('/cn/') || u.pathname.startsWith('/global/') ? request.url : `${base}/${active}${u.pathname}${u.search}`;
                    call('Fetch.continueRequest', { requestId, url }).catch(() => {});
                } else call('Fetch.failRequest', { requestId, errorReason: 'BlockedByClient' }).catch(() => {});
            }
        });
        const ev = async expression => { const r = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value; };
        await call('Page.enable'); await call('Runtime.enable'); await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
        let cases = 0;
        for (const name of ['cn', 'global']) {
            active = name;
            for (const route of ['/', '/review/']) {
                const before = loads;
                await call('Page.navigate', { url: `${base}/${name}${route}` });
                for (let n = 0; n < 100 && before === loads; n++) await pause(100);
                assert.ok(loads > before); await pause(500);
                if (route === '/review/') {
                    // Twikoo replaces its mount element; inspect the persistent
                    // theme wrapper and then the real provider's rendered root.
                    assert.equal(await ev("!!document.querySelector('.post-item-comment')"), name === 'global');
                    if (name === 'global') assert.equal(await ev("!!document.querySelector('#twikoo')"), true, 'real Twikoo UI mounted');
                }
                for (const width of [375, 767, 768, 1280, 1920]) {
                    await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
                    for (const mode of ['day', 'night']) {
                        await ev(`document.documentElement.dataset.appearance='${mode}';document.dispatchEvent(new CustomEvent('doratiger:appearancechange',{detail:{isDay:${mode === 'day'}}}))`);
                        await pause(500);
                        assert.equal(await ev("['#header-wrapper','#footer-wrapper','#content-wrapper'].some(s=>{const e=document.querySelector(s);return e.scrollWidth>e.clientWidth+1})"), false, `${name}${route} ${width} ${mode}`);
                        if (route === '/review/' && width === 375) {
                            await ev("document.querySelector('.post-item-copyright').scrollIntoView({block:'start'})");
                            const shot = await call('Page.captureScreenshot', { format: 'png' });
                            fs.writeFileSync(path.join(root, `${name}-${mode}.png`), Buffer.from(shot.data, 'base64'));
                        }
                        cases++;
                    }
                }
                await ev("document.querySelector('#header-right-search').click();const i=document.querySelector('.search-content-box-input');i.value='review';i.dispatchEvent(new Event('input',{bubbles:true}))");
                await pause(1000);
                assert.match(await ev("document.querySelector('#algolia-hits').textContent"), /review/i);
                await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
            }
        }
        assert.equal(requests.some(r => r.target === 'cn' && /comments\.example\.test|twikoo.*\.js/.test(r.url)), false, 'disabled target must not initialize comments');
        assert.deepEqual(exceptions, [], 'no unhandled runtime exceptions');
        console.log(`PASS: ${cases} deployed-clone viewport/appearance cases, local search, comment presence and disabled-target requests. Screenshots: ${root}`);
    } finally {
        for (const job of pending.values()) clearTimeout(job.timer);
        ws?.close(); chrome?.kill(); server.close();
        // Keep the small clone/screenshot set for visual inspection.
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

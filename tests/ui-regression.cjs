'use strict';

// Actual Hexo CLI build + Chromium. No production credentials or remote writes.
// Run from the theme: node tests/ui-regression.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const theme = path.resolve(__dirname, '..');
const twikooResource = require('js-yaml').load(fs.readFileSync(path.join(theme, '_config.yml'), 'utf8')).resource.twikoo.local.js[0];
const host = process.env.HEXO_HOST_DIR || path.resolve(theme, '../..');
const port = async () => {
    const server = net.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const value = server.address().port;
    await new Promise(resolve => server.close(resolve));
    return value;
};

(async () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-ui-'));
    let server, chrome, ws;
    const browserPort = await port();
    const sitePort = await port();
    const base = `http://127.0.0.1:${sitePort}`;
    const write = (file, content) => {
        const target = path.join(fixture, file);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, content);
    };
    try {
        fs.mkdirSync(path.join(fixture, 'themes'));
        for (const name of ['node_modules', 'package.json']) fs.symlinkSync(path.join(host, name), path.join(fixture, name));
        fs.symlinkSync(theme, path.join(fixture, 'themes/hexo-theme-doratiger'));
        // JSON is a YAML subset; keep the fixture independent from private overrides.
        write('_config.yml', JSON.stringify({ title: 'UI regression', author: 'Fixture', url: base,
            root: '/', language: 'en', theme: 'hexo-theme-doratiger', permalink: ':title/',
            syntax_highlighter: '', highlight: { enable: false } }));
        write('_config.hexo-theme-doratiger.yml', JSON.stringify({
            resource: { enable_cdn: false }, statistics: { enable: false },
            search: { enable: true, type: 'local', local: { content: true } },
            encrypt: { enable: true }, post: { highlight: { enable: true, type: 'highlight.js' } },
            post_extend: { sponsor: { enable: true, alipay: '/images/police_beian.png', wechat: '/images/police_beian.png' } },
            comment: { enable: true, type: 'valine', valine: { appId: 'fixture-MdYXbMMI', appKey: 'fixture-only' } },
            footer: { community_records: { enable: true, items: [1, 2, 3].map(n => ({ name: `Record ${n}`, text: `Record ${n}`, url: `https://example.test/${n}` })) } },
        }));
        const code = '\n## Code\n\n```javascript\nconst message = "review";\nconsole.log(message);\n```\n';
        write('source/_posts/review.md', '---\n' + JSON.stringify({title:'review',date:'2026-09-09',ai:{tools:[{name:'Example assistant with a long name',provider:'Example provider',model:'An explicitly declared model version'},{name:'Second tool'}],usage:['Research','Editing'],note:'Only the author can describe what was checked.'}}) + '\n---\n' + code);
        write('source/_posts/secret.md', '---\ntitle: secret\npassword: review-pass\ndate: 2026-09-09\n---\n' + code);
        const cli = path.join(host, 'node_modules/hexo/bin/hexo');
        for (const command of ['clean', 'generate']) {
            const result = spawnSync(process.execPath, [cli, command], { cwd: fixture, encoding: 'utf8' });
            assert.equal(result.status, 0, result.stdout + result.stderr);
            assert.doesNotMatch(result.stdout + result.stderr, /(?:ERROR|FATAL)/, 'Hexo must render every asset successfully');
        }
        server = spawn(process.execPath, [cli, 'server', '--static', '--ip', '127.0.0.1', '--port', String(sitePort)], { cwd: fixture, stdio: 'ignore' });
        chrome = spawn(process.env.CHROMIUM || 'chromium', ['--headless', '--no-sandbox', '--disable-gpu',
            `--remote-debugging-port=${browserPort}`, `--user-data-dir=${fixture}/browser`, 'about:blank'], { stdio: 'ignore' });
        let tabs;
        for (let i = 0; i < 100; i++) {
            try { tabs = await (await fetch(`http://127.0.0.1:${browserPort}/json`)).json(); await fetch(base); break; }
            catch { await pause(100); }
        }
        assert.ok(tabs?.length, 'Chromium must be available');
        ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
        await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
        let id = 0;
        const pending = new Map();
        const call = (method, params = {}) => new Promise((resolve, reject) => {
            const requestId = ++id;
            const timer = setTimeout(() => { pending.delete(requestId); reject(Error(`CDP timeout: ${method}`)); }, 15000);
            pending.set(requestId, { resolve, reject, timer });
            ws.send(JSON.stringify({ id: requestId, method, params }));
        });
        ws.addEventListener('message', event => {
            const message = JSON.parse(event.data);
            const job = pending.get(message.id);
            if (job) { clearTimeout(job.timer); pending.delete(message.id); message.error ? job.reject(message.error) : job.resolve(message.result); }
            if (message.method === 'Fetch.requestPaused') {
                const request = message.params;
                const local = request.request.url.startsWith(base + '/');
                call(local ? 'Fetch.continueRequest' : 'Fetch.failRequest', { requestId: request.requestId,
                    ...(local ? {} : { errorReason: 'BlockedByClient' }) }).catch(() => {});
            }
        });
        const ev = async expression => {
            const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
            assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
            return result.result.value;
        };
        await call('Page.enable');
        await call('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
        let loads = 0;
        ws.addEventListener('message', e => { if (JSON.parse(e.data).method === 'Page.loadEventFired') loads++; });
        const nav = async route => {
            const before = loads;
            await call('Page.navigate', { url: base + route });
            for (let i = 0; i < 100 && loads === before; i++) await pause(100);
            assert.ok(loads > before, `Page load: ${route}`);
            await pause(350);
        };
        const size = async (width, height) => {
            await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
            await pause(350);
        };
        const appearance = async mode => {
            await ev(`document.documentElement.dataset.appearance='${mode}';document.dispatchEvent(new CustomEvent('doratiger:appearancechange',{detail:{isDay:${mode === 'day'}}}))`);
            await pause(750);
        };
        const screenshot = async name => {
            if (!process.env.UI_SCREENSHOT_DIR) return;
            fs.mkdirSync(process.env.UI_SCREENSHOT_DIR, { recursive: true });
            const result = await call('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(process.env.UI_SCREENSHOT_DIR, `${name}.png`), Buffer.from(result.data, 'base64'));
        };
        const key = async key => {
            const windowsVirtualKeyCode = { Tab: 9, Enter: 13, Escape: 27 }[key];
            await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode,
                ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
            await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode });
        };
        await require('./layout-observation.cjs')({ ev, nav, size, pause, appearance, screenshot });
        await nav('/');
        for (const width of [1280, 1279, 1024, 768]) {
            await size(width, 900);
            assert.equal(await ev("document.querySelector('#header-left-menu-list').parentElement.id"), 'header-left', `${width}: navigation must remain in header`);
            assert.equal(await ev("getComputedStyle(document.querySelector('#header-left-menu-list')).flexDirection"), 'row');
            await ev("document.querySelector('#header-left-menu-icon').click()");
            assert.equal(await ev("getComputedStyle(document.querySelector('#header-left-menu-list')).display"), 'none');
            await ev("document.querySelector('#header-left-menu-icon').click()");
            assert.equal(await ev("document.querySelector('#main-container').inert"), false);
            assert.equal(await ev("(()=>{const e=document.querySelector('#header-wrapper');return e.scrollWidth>e.clientWidth+1})()"), false, `${width}: header overflow`);
        }
        await size(767, 900);
        assert.equal(await ev("document.querySelector('#header-left-menu-list').parentElement===document.body"), true);
        await ev("document.querySelector('#header-left-menu-icon').click()");
        assert.equal(await ev("getComputedStyle(document.querySelector('#header-left-menu-list')).flexDirection"), 'column');
        assert.equal(await ev("document.querySelector('#main-container').inert"), true);
        await screenshot('navigation-767');
        await size(768, 900);
        assert.equal(await ev("document.querySelector('#header-left-menu-list').parentElement.id"), 'header-left');
        assert.equal(await ev("document.querySelector('#main-container').inert"), false, 'leaving mobile menu must release background');
        await screenshot('navigation-768');
        for (const route of (process.env.UI_INTERACTIONS_ONLY ? [] : ['/', '/review/', '/secret/', '/archives/', '/404.html'])) {
            console.log(`Checking ${route}`);
            await nav(route);
            for (const [width, height] of [[320, 568], [375, 667], [768, 1024], [1440, 900], [3840, 2160]]) {
                await size(width, height);
                for (const mode of ['night', 'day']) {
                    await appearance(mode);
                    assert.equal(await ev("['#header-wrapper','#footer-wrapper','#content-wrapper'].some(s=>{const e=document.querySelector(s);return e.scrollWidth>e.clientWidth+1})"), false, `${route} ${width} ${mode}: shell overflow`);
                    if (route === '/review/') {
                        assert.equal(await ev("(()=>{const e=document.querySelector('#post-ai-disclosure');return !!e&&e.scrollWidth<=e.clientWidth+1})()"), true, `${width} ${mode}: AI disclosure must fit`);
                        await ev("document.querySelector('.post-item-ai-link').click()");
                        assert.equal(await ev("location.hash"), '#post-ai-disclosure');
                        assert.equal(await ev("(()=>{const r=document.querySelector('#post-ai-disclosure').getBoundingClientRect();return r.top>=48&&r.top<innerHeight-60})()"), true, 'AI anchor must scroll within the article stage');
                        if (width === 320 || width === 1440) await screenshot(`ai-${width}-${mode}`);
                    }
                }
            }
        }
        await nav('/'); await size(375, 667); await appearance('night');
        const more = await ev("(()=>{const e=document.querySelector('.post-item-more');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,nested:!!e.querySelector('a')}})()");
        assert.equal(more.nested, false);
        await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: more.x, y: more.y });
        await pause(300);
        assert.equal(await ev("getComputedStyle(document.querySelector('.post-item-more'),'::after').opacity"), '1');
        await screenshot('read-more-hover');
        await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
        await pause(80);
        const sheen = await ev("(()=>{const e=document.querySelector('.post-item-more'),s=getComputedStyle(e,'::before');return {opacity:Number(s.opacity),x:new DOMMatrix(s.transform).m41,width:e.clientWidth}})()");
        await ev(`(async()=>{
            await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/lib/instantsearch.js/@4.78.1/dist/instantsearch.production.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
            const container=document.createElement('div');container.id='algolia-pagination';document.querySelector('.search-content').appendChild(container);
            const search=instantsearch({indexName:'fixture',searchClient:{search:()=>Promise.resolve({results:[{hits:[],nbHits:50,page:0,nbPages:5,hitsPerPage:10,processingTimeMS:1,query:'',params:'',exhaustiveNbHits:true}]})}});
            search.addWidgets([instantsearch.widgets.pagination({container,scrollTo:false,showFirst:false,showLast:false,cssClasses:{root:'pagination',item:'pagination-item',link:'page-number',selectedItem:'current',disabledItem:'disabled-item'}})]);search.start();
            document.querySelector('#header-right-search').click();
        })()`);
        await pause(350);
        const pagination = await ev("(()=>{const items=Array.from(document.querySelectorAll('#algolia-pagination .ais-Pagination-item')).map(e=>e.getBoundingClientRect());return {count:items.length,gaps:items.slice(1).map((r,i)=>r.top>items[i].top+2?r.top-items[i].bottom:r.left-items[i].right),overflow:document.querySelector('.search-content').scrollWidth>document.querySelector('.search-content').clientWidth}})()");
        console.log('Hover exit / pagination:', JSON.stringify({sheen,pagination}));
        await screenshot('search-pagination');
        assert.ok(pagination.count >= 5, 'Real InstantSearch pagination must render');
        const failures = [];
        if (sheen.opacity > 0 && sheen.x > -sheen.width && sheen.x < sheen.width) failures.push('Hover exit must not sweep the highlight backwards');
        if (pagination.gaps.some(gap=>gap < 4)) failures.push('Search page buttons must have visible separation');
        if (pagination.overflow) failures.push('Search pagination must fit the dialog');
        assert.deepEqual(failures, []);
        for (const [width, height] of [[320, 568], [1440, 900]]) {
            await size(width, height);
            for (const mode of ['night', 'day']) {
                await appearance(mode);
                assert.equal(await ev("document.querySelector('.search-content').scrollWidth>document.querySelector('.search-content').clientWidth"), false, `${width} ${mode}: pagination overflow`);
                assert.ok(await ev("parseFloat(getComputedStyle(document.querySelector('#algolia-pagination .ais-Pagination-list')).columnGap)>=4"));
                await screenshot(`search-pagination-${width}-${mode}`);
            }
        }
        await size(375, 667); await appearance('night');
        await key('Escape');
        await ev("document.querySelector('#header-left-menu-icon').focus();document.querySelector('#header-left-menu-icon').click()");
        await screenshot('mobile-menu');
        assert.equal(await ev("document.querySelector('#header-left-menu-list').parentElement===document.body && getComputedStyle(document.querySelector('#header-left-menu-close')).display!=='none' && document.querySelector('#main-container').inert"), true);
        const tabTargets = new Set();
        for (let i = 0; i < 12; i++) {
            await key('Tab');
            assert.equal(await ev("document.querySelector('#header-left-menu-list').contains(document.activeElement)"), true);
            tabTargets.add(await ev('document.activeElement.outerHTML'));
        }
        assert.ok(tabTargets.size > 1, 'Tab must actually move between menu controls');
        await key('Escape');
        assert.equal(await ev("document.activeElement.id"), 'header-left-menu-icon');
        assert.equal(await ev("document.querySelector('#main-container').inert"), false);
        const beforeMode = await ev("document.documentElement.dataset.appearance");
        await ev("document.querySelector('#header-right-appearance').focus()");
        assert.equal(await ev('document.activeElement.id'), 'header-right-appearance');
        await key('Enter');
        assert.notEqual(await ev("document.documentElement.dataset.appearance"), beforeMode);
        await size(1440, 900);
        await nav('/');
        const heroGeometry = () => ev(`(()=>{const c=document.querySelector('#hero-canvas'),p=c.parentElement.getBoundingClientRect(),r=c.getBoundingClientRect();return {parent:p.width,canvas:r.width,bitmap:c.width/devicePixelRatio,offset:r.x+r.width/2-p.x-p.width/2}})()`);
        for (const mode of ['night', 'day']) {
            await appearance(mode);
            for (const width of [1440, 1920, 3840]) {
                await size(width, 900);
                for (let i = 0; i < 2; i++) {
                    await ev("document.querySelector('#footer-left-sidebar-icon').click()");
                    await pause(750); // No viewport resize: only the sidebar changes layout.
                    const geometry = await heroGeometry();
                    assert.ok(Math.abs(geometry.canvas - geometry.parent) < 1, `Hero container resize ${mode}/${width}: ${JSON.stringify(geometry)}`);
                    assert.ok(Math.abs(geometry.bitmap - geometry.parent) < 1, `Hero bitmap resize: ${JSON.stringify(geometry)}`);
                    assert.ok(Math.abs(geometry.offset) < 1, `Hero center: ${JSON.stringify(geometry)}`);
                    if (width === 1440 && i === 0) await screenshot(`hero-sidebar-collapsed-${mode}`);
                }
            }
        }
        await size(1440, 900);
        await ev("document.querySelector('#footer-left-sidebar-icon').click()"); await size(1441, 900);
        assert.equal(await ev("document.querySelector('#sidebar-container').classList.contains('closed')"), true);
        await size(375, 667);
        assert.equal(await ev("Array.from(document.querySelectorAll('.footer-right-community-records-item')).every(e=>getComputedStyle(e).display==='none')"), true);
        await size(3840, 2160);
        assert.equal(await ev("Array.from(document.querySelectorAll('.footer-right-community-records-item')).every(e=>getComputedStyle(e).display!=='none')"), true);
        // Keep the index pending until the loading-state assertion, regardless
        // of how long navigation, resizing or appearance transitions take.
        const searchGate = await call('Page.addScriptToEvaluateOnNewDocument', { source: "const originalFetch=fetch;const searchReady=new Promise(resolve=>window.releaseSearchIndex=resolve);window.fetch=(...args)=>String(args[0]).includes('search.json')?searchReady.then(()=>originalFetch(...args)):originalFetch(...args);" });
        await nav('/'); await size(375, 667); await appearance('night');
        await ev("document.querySelector('#header-right-search').click();const input=document.querySelector('.search-content-box-input');input.value='review';input.dispatchEvent(new Event('input'))");
        assert.equal(await ev("getComputedStyle(document.querySelector('.search-content-box-input')).color"), 'rgb(255, 255, 255)');
        for (let i = 0; i < 50 && !await ev("/Loading/.test(document.querySelector('#algolia-hits').innerText)"); i++) await pause(100);
        assert.match(await ev("document.querySelector('#algolia-hits').innerText"), /Loading/);
        await ev("window.releaseSearchIndex()");
        for (let i = 0; i < 50 && !await ev("!!document.querySelector('#algolia-hits .algolia-hit-item')"); i++) await pause(100);
        assert.match(await ev("document.querySelector('#algolia-hits').innerText"), /review/);
        await call('Page.removeScriptToEvaluateOnNewDocument', { identifier: searchGate.identifier });
        await nav('/secret/'); await size(320, 568);
        assert.equal(await ev("(()=>{const p=document.querySelector('.hexo-encrypt').getBoundingClientRect();const b=document.querySelector('.hexo-encrypt-submit').getBoundingClientRect();return b.right<=p.right&&b.left>=p.left})()"), true);
        await ev("document.querySelector('.hexo-encrypt-password').value='review-pass';document.querySelector('.hexo-encrypt-submit').click()");
        await pause(700);
        assert.equal(await ev("!!document.querySelector('.hexo-encrypt code[data-highlighted]')"), true);
        const listeners = await call('Runtime.evaluate', { expression: "getEventListeners(document.querySelector('.hexo-encrypt .code-header-copy')).click.length", includeCommandLineAPI: true, returnByValue: true });
        assert.equal(listeners.result.value, 1);
        await nav('/review/');
        await ev("document.querySelector('#sponsor-btn').focus()"); await key('Enter');
        assert.equal(await ev("!document.querySelector('#sponsor-panel').hidden"), true);
        assert.equal(await ev("document.querySelector('.post-item-sponsor-panel-codes').scrollWidth<=innerWidth"), true);
        assert.equal(await ev("!!document.querySelector('.vwrap .vsubmit.vbtn')"), true, 'Valine must actually mount');
        for (const provider of ['gitment', 'twikoo']) {
            await nav('/review/');
            await ev(`(async()=>{const container=document.querySelector('#comment-container');container.replaceChildren();await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='${provider === 'gitment' ? '/lib/gitment/gitment.browser.js' : twikooResource}';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});${provider === 'gitment' ? "const link=document.createElement('link');link.rel='stylesheet';link.href='/lib/gitment/default.css';document.head.appendChild(link);new Gitment({owner:'fixture',repo:'fixture',oauth:{client_id:'fixture',client_secret:'fixture'}}).render('comment-container');" : "twikoo.init({envId:'http://127.0.0.1:9',el:'#comment-container'});"}})()`);
            await pause(500);
            for (const mode of ['night', 'day']) {
                await appearance(mode);
                if (provider === 'gitment') {
                    assert.equal(await ev("(()=>{const tabs=document.querySelector('.gitment-editor-tabs').getBoundingClientRect();const login=document.querySelector('.gitment-editor-login').getBoundingClientRect();return login.top>=tabs.bottom&&login.right<=innerWidth})()"), true, 'Gitment login must not overlap tabs');
                } else {
                    assert.equal(await ev("!!document.querySelector('#twikoo .tk-send')"), true, 'Twikoo must actually mount');
                    assert.equal(await ev("document.querySelector('#twikoo .tk-submit').scrollWidth<=innerWidth"), true);
                }
                await ev("document.querySelector('.post-item-comment').scrollIntoView({block:'center'})");
                await screenshot(`${provider}-${mode}`);
            }
        }
        await nav('/review/');
        for (const mode of ['night', 'day']) {
            await appearance(mode);
            const contrast = await ev(`(()=>{
                const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
                const luminance=value=>{ctx.fillStyle=value;ctx.fillRect(0,0,1,1);const c=Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
                const tokens=getComputedStyle(document.documentElement);const a=luminance(tokens.getPropertyValue('--dt-on-accent'));const b=luminance(tokens.getPropertyValue('--dt-accent'));
                return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
            })()`);
            assert.ok(contrast >= 4.5, `${mode} action contrast: ${contrast}`);
        }
        await ev("document.documentElement.dataset.appearance='system'");
        await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
        assert.equal(await ev("getComputedStyle(document.documentElement).getPropertyValue('--dt-text').trim()"), '#073642');
        await nav('/');
        const lines = await ev("(async()=>{document.querySelector('#hero-canvas').dataset.title='A deliberately long blog title with many wrapped title lines';const {default:Hero}=await import('/js/layout/hero.js');const h=new Hero();return {height:h.height,lines:h.lines.map(l=>({y:l.y,height:l.lineHeight}))}})()");
        assert.ok(lines.lines.length > 1);
        for (let i = 0; i < lines.lines.length; i++) {
            assert.ok(lines.lines[i].y >= 0 && lines.lines[i].y + lines.lines[i].height <= lines.height);
            if (i) assert.ok(lines.lines[i].y > lines.lines[i - 1].y);
        }
        const css = fs.readFileSync(path.join(fixture, 'public/css/main.css'), 'utf8');
        const transitions = [...css.matchAll(/transition:\s*([^;]+);/g)].map(m => m[1]);
        assert.deepEqual(await ev(`(${JSON.stringify(transitions)}).filter(v=>!CSS.supports('transition',v))`), []);
        await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
        await call('Page.addScriptToEvaluateOnNewDocument', { source: "window.frames404=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.id==='page404-canvas')window.frames404++;return clear.apply(this,a)};" });
        await nav('/404.html');
        const frames = await ev('window.frames404'); await pause(300);
        assert.equal(await ev('window.frames404'), frames);
        console.log(`PASS: Hexo CLI build, ${process.env.UI_INTERACTIONS_ONLY ? 0 : 50} layout cases, modal keyboard, appearance, sidebar, records, search, encryption, sponsor, comments, contrast, Hero, transitions and reduced motion.`);
    } finally {
        ws?.close();
        for (const child of [chrome, server]) {
            if (child && child.exitCode === null) {
                await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
            }
        }
        fs.rmSync(fixture, { recursive: true, force: true });
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

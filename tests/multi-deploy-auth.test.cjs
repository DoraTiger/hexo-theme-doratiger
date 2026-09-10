'use strict';
// Real Hexo CLI -> system Git -> local TLS smart-HTTP -> a temporary bare repo.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const https = require('node:https');
const { spawn, spawnSync } = require('node:child_process');
const host = process.env.HEXO_HOST_DIR;
assert.ok(host, 'Set HEXO_HOST_DIR to a Hexo installation');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-auth-'));
const site = path.join(root, 'site');
const secret = 'FIXTURE-TOKEN-ONLY-NOT-A-REAL-CREDENTIAL';
const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.test', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.test', GIT_SSL_CAINFO: path.join(root, 'cert.pem') };
const write = (name, value) => { const p = path.join(site, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value)); };
const git = (...args) => { const checkEnv = { ...env }; delete checkEnv.GIT_TRACE; delete checkEnv.GIT_TRACE_CURL; const r = spawnSync('git', args, { env: checkEnv, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
const cli = (...args) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(host, 'node_modules/hexo/bin/hexo'), ...args], { cwd: site, env });
    let output = ''; child.stdout.on('data', b => output += b); child.stderr.on('data', b => output += b);
    child.on('error', reject); child.on('close', status => resolve({ status, output }));
});
const ok = r => { assert.equal(r.status, 0, r.output); assert.doesNotMatch(r.output, /ERROR|FATAL/); };
const fails = (r, code) => { assert.notEqual(r.status, 0); assert.match(r.output, new RegExp(code)); assert.ok(!r.output.includes(secret)); };
let server, requests = 0, redirect = false;
(async () => {
    try {
        fs.mkdirSync(site); fs.mkdirSync(path.join(site, 'themes'));
        fs.symlinkSync(path.join(host, 'node_modules'), path.join(site, 'node_modules'));
        fs.symlinkSync(path.resolve(__dirname, '..'), path.join(site, 'themes/hexo-theme-doratiger'));
        for (const name of ['package.json', 'package-lock.json']) write(name, fs.readFileSync(path.join(host, name)).toString());
        write('_config.yml', { title: 'Token fixture', url: 'https://example.test', theme: 'hexo-theme-doratiger', language: 'en', permalink: ':title/' });
        write('source/_posts/auth.md', '---\ntitle: auth\ndate: 2026-09-10\n---\nToken publication.');
        write('doratiger_config.cn.yml', { site: {}, theme: {} });
        git('init', '--bare', path.join(root, 'target.git'));
        git('--git-dir', path.join(root, 'target.git'), 'config', 'http.receivepack', 'true');
        const cert = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', path.join(root, 'key.pem'), '-out', path.join(root, 'cert.pem'), '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1'], { encoding: 'utf8' });
        assert.equal(cert.status, 0, cert.stderr);
        server = https.createServer({ key: fs.readFileSync(path.join(root, 'key.pem')), cert: fs.readFileSync(path.join(root, 'cert.pem')) }, (req, res) => {
            requests++;
            if (req.headers.authorization !== 'Basic ' + Buffer.from('fixture-user:' + secret).toString('base64')) { res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="fixture"' }); res.end(); return; }
            if (redirect) { res.writeHead(302, { Location: '/unexpected' }); res.end(); return; }
            const url = new URL(req.url, 'https://localhost');
            const backendEnv = { ...env }; delete backendEnv.GIT_TRACE; delete backendEnv.GIT_TRACE_CURL;
            const backend = spawn('git', ['http-backend'], { env: { ...backendEnv, GIT_PROJECT_ROOT: root, GIT_HTTP_EXPORT_ALL: '1', PATH_INFO: url.pathname, QUERY_STRING: url.search.slice(1), REQUEST_METHOD: req.method, CONTENT_TYPE: req.headers['content-type'] || '', CONTENT_LENGTH: req.headers['content-length'] || '', REMOTE_USER: 'fixture-user' } });
            let head = Buffer.alloc(0), started = false;
            backend.stdout.on('data', chunk => {
                if (started) { res.write(chunk); return; }
                head = Buffer.concat([head, chunk]); const split = head.indexOf('\r\n\r\n'); if (split < 0) return;
                const headers = {}; let status = 200;
                for (const line of head.subarray(0, split).toString().split('\r\n')) {
                    const colon = line.indexOf(':'); const key = line.slice(0, colon), value = line.slice(colon + 1).trim();
                    if (key.toLowerCase() === 'status') status = parseInt(value); else headers[key] = value;
                }
                res.writeHead(status, headers); res.write(head.subarray(split + 4)); started = true;
            });
            backend.stderr.resume(); backend.on('close', () => res.end()); req.pipe(backend.stdin);
        });
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        const config = { resource: { enable_cdn: false }, statistics: { enable: false }, multi_deploy: { enable: true, targets: { cn: { config: 'doratiger_config.cn.yml', publish: { type: 'git', repo: `https://127.0.0.1:${server.address().port}/target.git`, branch: 'pages', token: '$MULTI_TEST_TOKEN', username: 'fixture-user', name: 'Token Author', email: 'token@example.test', message: 'Authenticated publish' } } } } };
        write('_config.hexo-theme-doratiger.yml', config);
        ok(await cli('multi-push', 'cn', '--dry-run'));
        assert.equal(requests, 0);
        fails(await cli('multi-deploy', 'cn'), 'MULTI_AUTH');
        assert.equal(fs.existsSync(path.join(site, 'plugins/multi_deploy')), false);
        env.MULTI_TEST_TOKEN = secret;
        env.GIT_TRACE = path.join(root, 'trace.log'); env.GIT_TRACE_CURL = path.join(root, 'curl.log');
        ok(await cli('multi-deploy', 'cn'));
        assert.match(git('--git-dir', path.join(root, 'target.git'), 'show', 'pages:auth/index.html'), /Token publication/);
        assert.equal(git('--git-dir', path.join(root, 'target.git'), 'show', '-s', '--format=%s|%an', 'pages'), 'Authenticated publish|Token Author');
        const previous = git('--git-dir', path.join(root, 'target.git'), 'rev-parse', 'pages');
        ok(await cli('multi-push', 'cn'));
        assert.equal(git('--git-dir', path.join(root, 'target.git'), 'rev-parse', 'pages'), previous);
        env.MULTI_TEST_TOKEN = 'wrong'; fails(await cli('multi-push', 'cn'), 'MULTI_GIT');
        env.MULTI_TEST_TOKEN = secret; redirect = true; const before = requests;
        fails(await cli('multi-push', 'cn'), 'MULTI_GIT');
        assert.equal(requests - before, 1, 'authenticated requests must not follow redirects');
        assert.equal(fs.existsSync(path.join(root, 'curl.log')), false, 'inherited tracing must not persist credential headers');
        function inspect(directory) {
            for (const e of fs.readdirSync(directory, { withFileTypes: true })) {
                if (e.isSymbolicLink()) continue;
                const file = path.join(directory, e.name);
                if (e.isDirectory()) inspect(file);
                else { const value = fs.readFileSync(file); assert.equal(value.includes(secret), false, file); assert.equal(value.includes(Buffer.from('fixture-user:' + secret).toString('base64')), false, file); }
            }
        }
        inspect(path.join(site, 'plugins/multi_deploy'));
        console.log('PASS: real Hexo CLI HTTPS token push, metadata, no-op, missing/invalid token, redirect refusal and no persisted secret.');
    } finally {
        if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

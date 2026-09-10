'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
test('real Hexo debug reports a rejected local push without exposing server diagnostics', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-debug-cli-'));
    const host = process.env.HEXO_HOST_DIR;
    assert.ok(host);
    const site = path.join(root, 'site'), repo = path.join(root, 'target.git');
    const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.test', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.test' };
    const write = (file, data) => { const p = path.join(site, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data)); };
    const cli = (...args) => spawnSync(process.execPath, [path.join(host, 'node_modules/hexo/bin/hexo'), ...args], { cwd: site, env, encoding: 'utf8', timeout: 60000 });
    try {
        fs.mkdirSync(path.join(site, 'themes'), { recursive: true });
        fs.symlinkSync(path.resolve(__dirname, '..'), path.join(site, 'themes/hexo-theme-doratiger'));
        for (const name of ['node_modules', 'package.json']) fs.symlinkSync(path.join(host, name), path.join(site, name));
        assert.equal(spawnSync('git', ['init', '--bare', repo]).status, 0);
        fs.writeFileSync(path.join(repo, 'hooks/pre-receive'), '#!/bin/sh\necho "GH013 PRIVATE_SENTINEL https://private.test/unblock-secret" >&2\nexit 1\n', { mode: 0o700 });
        write('_config.yml', { title: 'Fixture', url: 'https://example.test', theme: 'hexo-theme-doratiger', language: 'en' });
        write('_config.hexo-theme-doratiger.yml', { resource: { enable_cdn: false }, statistics: { enable: false }, multi_deploy: { enable: true, targets: { test: { config: 'profile.yml', publish: { type: 'git', repo, branch: 'pages' } } } } });
        write('profile.yml', {});
        write('source/_posts/test.md', '---\ntitle: test\ndate: 2026-09-10\n---\nFixture');
        const savedPath = env.PATH;
        env.PATH = path.join(root, 'no-executables');
        fs.mkdirSync(env.PATH);
        for (const action of ['multi-generate', 'multi-push', 'multi-deploy']) {
            const missing = cli(action, 'test');
            assert.notEqual(missing.status, 0);
            assert.match(missing.stdout + missing.stderr, /MULTI_GIT_MISSING/);
            assert.match(missing.stdout + missing.stderr, /PATH/);
        }
        assert.equal(fs.existsSync(path.join(site, 'plugins/multi_deploy')), false);
        for (const action of ['multi-history', 'multi-clean']) {
            const independent = cli(action, 'test');
            assert.equal(independent.status, 0, independent.stdout + independent.stderr);
        }
        const ordinary = cli('generate');
        assert.equal(ordinary.status, 0, ordinary.stdout + ordinary.stderr);
        env.PATH = savedPath;
        const build = cli('multi-generate', 'test'); assert.equal(build.status, 0, build.stdout + build.stderr);
        for (const debug of [false, true]) {
            const result = cli('multi-push', 'test', ...(debug ? ['--debug'] : []));
            assert.notEqual(result.status, 0);
            const output = result.stdout + result.stderr;
            assert.match(output, /MULTI_GIT/);
            assert.doesNotMatch(output, /PRIVATE_SENTINEL|private\.test/);
            if (debug) assert.match(output, /\[multi-debug\].*"operation":"push".*github-rule-rejection/);
            else assert.doesNotMatch(output, /\[multi-debug\]/);
        }
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

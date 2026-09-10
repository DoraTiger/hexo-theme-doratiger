'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('real Hexo Pages artifacts are opt-in, validated, target-isolated and pushed unchanged', () => {
    const host = process.env.HEXO_HOST_DIR;
    assert.ok(host);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-pages-'));
    const site = path.join(root, 'site'), repo = path.join(root, 'target.git');
    const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.test', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.test' };
    const write = (file, data) => { const p = path.join(site, file); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof data === 'string' ? data : JSON.stringify(data)); };
    const cli = (...args) => {
        const result = spawnSync(process.execPath, [path.join(host, 'node_modules/hexo/bin/hexo'), ...args], { cwd: site, env, encoding: 'utf8', timeout: 60000 });
        assert.ifError(result.error);
        return { status: result.status, output: result.stdout + result.stderr };
    };
    const ok = (...args) => { const r = cli(...args); assert.equal(r.status, 0, r.output); };
    const reject = (code, ...args) => { const r = cli(...args); assert.notEqual(r.status, 0, r.output); assert.match(r.output, new RegExp(`MULTI_${code}`)); };
    const git = (...args) => { const r = spawnSync('git', ['--git-dir', repo, ...args], { env, encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
    const artifact = name => {
        const work = path.join(site, 'plugins/multi_deploy');
        const pointer = JSON.parse(fs.readFileSync(path.join(work, 'latest', `${name}.json`)));
        return path.join(work, pointer.directory, 'artifact');
    };
    const publish = branch => ({ type: 'git', repo, branch });
    const targets = {
        github: { config: 'profile.yml', publish: { ...publish('pages'), pages: { enable: true, cname: 'www.example.test' } } },
        plain: { config: 'profile.yml', publish: publish('plain') },
    };
    const settings = { resource: { enable_cdn: false }, statistics: { enable: false }, multi_deploy: { enable: true, targets } };
    const save = () => write('_config.hexo-theme-doratiger.yml', settings);
    try {
        fs.mkdirSync(path.join(site, 'themes'), { recursive: true });
        fs.symlinkSync(path.resolve(__dirname, '..'), path.join(site, 'themes/hexo-theme-doratiger'));
        for (const name of ['node_modules', 'package.json']) fs.symlinkSync(path.join(host, name), path.join(site, name));
        assert.equal(spawnSync('git', ['init', '--bare', repo]).status, 0);
        write('_config.yml', { title: 'Fixture', url: 'https://not-the-cname.example.test', theme: 'hexo-theme-doratiger', language: 'en' });
        write('profile.yml', {});
        write('source/_posts/test.md', '---\ntitle: test\ndate: 2026-09-10\n---\nFixture');
        save();
        ok('multi-generate', '--all');
        assert.equal(fs.readFileSync(path.join(artifact('github'), 'CNAME'), 'utf8'), 'www.example.test\n');
        assert.equal(fs.readFileSync(path.join(artifact('github'), '.nojekyll'), 'utf8'), '');
        for (const name of ['CNAME', '.nojekyll']) {
            assert.equal(fs.existsSync(path.join(artifact('plain'), name)), false);
            assert.equal(fs.existsSync(path.join(site, 'source', name)), false);
        }
        ok('multi-push', 'github');
        assert.equal(git('show', 'pages:CNAME'), 'www.example.test');
        assert.equal(git('show', 'pages:.nojekyll'), '');
        const commit = git('rev-parse', 'pages');
        ok('multi-push', 'github');
        assert.equal(git('rev-parse', 'pages'), commit);
        fs.writeFileSync(path.join(artifact('github'), 'CNAME'), 'tampered.test\n');
        reject('ARTIFACT', 'multi-push', 'github');
        assert.equal(git('rev-parse', 'pages'), commit);
        write('source/CNAME', 'www.example.test\n');
        ok('multi-generate', 'github');
        assert.equal(fs.readFileSync(path.join(artifact('github'), 'CNAME'), 'utf8'), 'www.example.test\n');
        write('source/CNAME', 'conflict.example.test\n');
        reject('PAGES_CONFLICT', 'multi-generate', 'github');
        assert.equal(fs.readFileSync(path.join(site, 'source/CNAME'), 'utf8'), 'conflict.example.test\n');
        targets.github.publish.pages = { enable: true };
        save();
        reject('STALE', 'multi-push', 'github');
        ok('multi-generate', 'github');
        assert.equal(fs.readFileSync(path.join(artifact('github'), 'CNAME'), 'utf8'), 'conflict.example.test\n');
        fs.unlinkSync(path.join(site, 'source/CNAME'));
        ok('multi-deploy', 'github');
        assert.equal(fs.existsSync(path.join(artifact('github'), 'CNAME')), false);
        assert.equal(fs.existsSync(path.join(artifact('github'), '.nojekyll')), true);
        assert.equal(git('show', 'pages:.nojekyll'), '');
        assert.doesNotMatch(git('ls-tree', '--name-only', 'pages'), /^CNAME$/m);
        targets.github.publish.pages.cname = 'www.example.test';
        save();
        write('scripts/conflicting-cname.js', "hexo.extend.generator.register('conflicting-cname', () => ({ path: 'CNAME', data: 'generated.example.test\\n' }));");
        reject('PAGES_CONFLICT', 'multi-generate', 'github');
        fs.unlinkSync(path.join(site, 'scripts/conflicting-cname.js'));
        targets.github.publish.pages = { enable: false, cname: 'www.example.test' };
        save();
        ok('multi-generate', 'github');
        assert.equal(fs.existsSync(path.join(artifact('github'), '.nojekyll')), false);
        assert.equal(fs.existsSync(path.join(artifact('github'), 'CNAME')), false);
        for (const pages of [true, { enable: 'true' }, { enable: true, unknown: true }, ...['https://example.test', 'example.test/path', 'a.test\nb.test', '127.0.0.1', '*.example.test', 'localhost', '-bad.test', ''].map(cname => ({ enable: true, cname }))]) {
            targets.github.publish.pages = pages;
            save();
            reject('PAGES_CONFIG', 'multi-generate', 'github', '--dry-run');
        }
        for (const [language, text] of [['zh-CN', /配置无效/], ['zh-TW', /配置無效/]]) {
            write('_config.yml', { title: 'Fixture', url: 'https://example.test', theme: 'hexo-theme-doratiger', language });
            const result = cli('multi-generate', 'github', '--dry-run');
            assert.notEqual(result.status, 0);
            assert.match(result.output, text);
        }
        assert.match(cli('--help').output, /DoraTiger: multi-target generate/);
        console.log('PASS: real Hexo Pages generation, opt-out, source conflict/preservation, no URL inference, local push idempotency, tampering and validation.');
    } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { git } = require('../scripts/utils/multi-deploy/process');
const { merge, resolve } = require('../scripts/utils/multi-deploy/config');
const { validateDestination, publish } = require('../scripts/utils/multi-deploy/publishers/git');
const { tree, digest } = require('../scripts/utils/multi-deploy/files');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-security-'));
(async () => {
    const original = process.env.GIT_DIR;
    try {
        for (const name of ['expected', 'foreign']) {
            const result = spawnSync('git', ['init', path.join(root, name)], { encoding: 'utf8' });
            assert.equal(result.status, 0, result.stderr);
        }
        process.env.GIT_DIR = path.join(root, 'foreign/.git');
        assert.equal(await git(['rev-parse', '--absolute-git-dir'], path.join(root, 'expected')), path.join(root, 'expected/.git'), 'inherited GIT_DIR must not redirect publishing operations');
        assert.deepEqual(merge({ nested: { a: 1, b: true }, list: [1, 2] }, { nested: { b: false }, list: [] }), { nested: { a: 1, b: false }, list: [] });
        assert.throws(() => merge(JSON.parse('{"__proto__":{"polluted":true}}')), /MULTI_CONFIG/);
        delete process.env.GIT_DIR;
        const base = path.join(root, 'expected');
        await git(['config', 'user.name', 'Host-local Identity'], base);
        await git(['config', 'user.email', 'host-local@example.test'], base);
        const repo = path.join(root, 'target.git');
        await git(['init', '--bare', repo], base);
        const target = { name: 'identity', publish: { type: 'git', repo, branch: 'pages' } };
        await validateDestination(target, base, true);
        const artifact = path.join(root, 'artifact'); fs.mkdirSync(artifact);
        fs.writeFileSync(path.join(artifact, 'index.html'), 'Identity fixture');
        await publish(target, { artifact, treeHash: digest(JSON.stringify(tree(artifact))) }, root);
        assert.equal(await git(['--git-dir', repo, 'show', '-s', '--format=%an <%ae>', 'pages'], base), 'Host-local Identity <host-local@example.test>', 'publishing must preserve the identity resolved from the host config');
        fs.mkdirSync(path.join(base, 'source'));
        fs.writeFileSync(path.join(base, '_config.yml'), '{}');
        fs.writeFileSync(path.join(base, 'profile.yml'), '{}');
        const fake = { base_dir: base, theme_dir: path.join(root, 'foreign'), public_dir: path.join(base, 'public'), config: { theme: '../escape' }, doratiger: { config: { multi_deploy: { enable: true, targets: { cn: { config: 'profile.yml', publish: { type: 'git', repo, branch: 'pages' } } } } } } };
        assert.throws(() => resolve(fake, { _: ['cn'] }), /MULTI_PATH/, 'theme name must not escape the snapshot theme directory');
        fake.config.theme = 'fixture';
        const spec = fake.doratiger.config.multi_deploy.targets.cn;
        const valid = { type: 'git', repo: 'https://example.test/site.git', branch: 'pages' };
        for (const invalid of [
            { token: 'literal-secret' }, { token: '$MISSING', repo },
            { message: 'Publish\nDoratiger-Target: other' }, { name: 'x<y>' },
            { email: 'x\ny' }, { username: 'user' }, { token: '$TOKEN', username: 'user:password' },
        ]) {
            spec.publish = { ...valid, ...invalid };
            assert.throws(() => resolve(fake, { _: ['cn'] }), /MULTI_CONFIG/);
        }
        spec.publish = { ...valid, token: '$TOKEN', username: 'user', message: 'Release', name: 'Author', email: 'author@example.test' };
        assert.equal(resolve(fake, { _: ['cn'] }).targets[0].publish.token, '$TOKEN', 'planning retains only the environment reference');
        console.log('PASS: Git environment isolation, explicit false/array replacement, prototype rejection.');
    } finally {
        if (original === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = original;
        fs.rmSync(root, { recursive: true, force: true });
    }
})().catch(error => { console.error(error); process.exitCode = 1; });

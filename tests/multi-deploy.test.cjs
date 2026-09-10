'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const host = process.env.HEXO_HOST_DIR || path.resolve(__dirname, '../../..');
const theme = path.resolve(__dirname, '..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-multi-test-'));
const site = path.join(root, 'site');
const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.test', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.test' };
const write = (name, value) => { const p = path.join(site, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof value === 'string' ? value : JSON.stringify(value)); };
const run = (bin, args, cwd = site) => {
    const r = spawnSync(bin, args, { cwd, env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    if (r.error) throw r.error;
    return { status: r.status, output: r.stdout + r.stderr, stdout: r.stdout.trim() };
};
const git = (args, cwd = site) => { const r = run('git', args, cwd); assert.equal(r.status, 0, r.output); return r.stdout; };
const cli = (...args) => run(process.execPath, [path.join(host, 'node_modules/hexo/bin/hexo'), ...args]);
const ok = r => { assert.equal(r.status, 0, r.output); assert.doesNotMatch(r.output, /(?:ERROR|FATAL)/); return r; };
const fails = (r, code) => { assert.notEqual(r.status, 0, r.output); assert.match(r.output, new RegExp(code)); };
const themeConfig = {
    resource: { enable_cdn: false }, statistics: { enable: false },
    search: { enable: true, type: 'local', local: { content: true } },
    private_fixture_key: 'PRIVATE-CONFIG-SENTINEL',
    comment: { enable: true, type: 'twikoo', twikoo: { envId: 'https://comments.example.test' } },
    footer: { beian: { miit: { enable: true, text: 'FIXTURE-MIIT' }, mps: { enable: true, text: 'FIXTURE-MPS' } } },
    multi_deploy: { enable: false, targets: Object.fromEntries(['cn', 'global'].map(n => [n, { config: `doratiger_config.${n}.yml`, publish: { type: 'git', repo: path.join(root, `${n}.git`), branch: 'pages' } }])) },
};
try {
    fs.mkdirSync(path.join(site, 'themes'), { recursive: true });
    fs.symlinkSync(path.join(host, 'node_modules'), path.join(site, 'node_modules'));
    fs.symlinkSync(theme, path.join(site, 'themes/hexo-theme-doratiger'));
    write('package.json', fs.readFileSync(path.join(host, 'package.json')) .toString());
    write('package-lock.json', fs.readFileSync(path.join(host, 'package-lock.json')).toString());
    write('_config.yml', { title: 'Dual site', url: 'https://base.example.test', theme: 'hexo-theme-doratiger', language: 'en', permalink: ':title/', theme_config: { comment: { enable: true } } });
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    write('source/_posts/review.md', '---\ntitle: review\ndate: 2026-09-09\n---\n## Shared content\n\nSame article.\n');
    write('source/_drafts/private.md', '---\ntitle: private\n---\nDRAFT-SENTINEL');
    write('doratiger_config.cn.yml', { site: { url: 'https://cn.example.test', root: '/' }, theme: { comment: { enable: false }, header: { menu: [] } } });
    write('doratiger_config.global.yml', { site: { url: 'https://global.example.test', root: '/' }, theme: { footer: { beian: { miit: { enable: false }, mps: { enable: false } } } } });
    assert.match(ok(cli('--help')).output, /multi-generate/, 'commands must be registered before enable check');
    fails(cli('multi-generate', 'cn'), 'MULTI_DISABLED');
    assert.equal(fs.existsSync(path.join(site, 'plugins/multi_deploy')), false);
    themeConfig.multi_deploy.enable = true;
    themeConfig.multi_deploy.cleanup = { keep_builds: 1, keep_records: 2 };
    Object.assign(themeConfig.multi_deploy.targets.cn.publish, {
        message: 'Deploy CN articles', name: 'CN Publisher', email: 'cn@example.test',
    });
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    fails(cli('multi-generate', 'unknown'), 'MULTI_TARGET');
    themeConfig.multi_deploy.targets.input = { ...themeConfig.multi_deploy.targets.cn };
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    fails(cli('multi-generate', 'input', '--dry-run'), 'MULTI_TARGET');
    delete themeConfig.multi_deploy.targets.input;
    for (const workDir of ['scripts/multi_deploy', 'scaffolds/multi_deploy']) {
        themeConfig.multi_deploy.work_dir = workDir;
        write('_config.hexo-theme-doratiger.yml', themeConfig);
        fails(cli('multi-generate', 'cn', '--dry-run'), 'MULTI_PATH');
        assert.equal(fs.existsSync(path.join(site, workDir)), false, 'invalid work directory must not be created');
    }
    delete themeConfig.multi_deploy.work_dir;
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    ok(cli('multi-generate', '--all', '--dry-run'));
    assert.equal(fs.existsSync(path.join(site, 'plugins/multi_deploy')), false, 'dry run must not write');
    assert.deepEqual(JSON.parse(ok(cli('multi-history', 'cn', '--json', '--silent')).stdout), []);
    ok(cli('multi-clean', '--all'));
    assert.equal(fs.existsSync(path.join(site, 'plugins/multi_deploy')), false, 'maintenance reads must not create state');
    for (const n of ['cn', 'global']) git(['init', '--bare', path.join(root, `${n}.git`)]);
    ok(cli('multi-deploy', '--all'));
    const remote = (n, ...args) => git(['--git-dir', path.join(root, `${n}.git`), ...args]);
    assert.equal(remote('cn', 'show', '-s', '--format=%s|%an|%ae|%cn|%ce', 'pages'), 'Deploy CN articles|CN Publisher|cn@example.test|CN Publisher|cn@example.test');
    assert.equal(remote('global', 'show', '-s', '--format=%an|%ae', 'pages'), 'Fixture|fixture@example.test');
    fails(cli('multi-generate', 'cn', '--force'), 'MULTI_TARGET');
    fails(cli('multi-deploy', 'cn', '--force'), 'MULTI_TARGET');
    const cn = remote('cn', 'show', 'pages:review/index.html');
    const global = remote('global', 'show', 'pages:review/index.html');
    assert.match(cn, /https:\/\/cn.example.test/);
    assert.match(global, /https:\/\/global.example.test/);
    assert.match(cn, /FIXTURE-MIIT/); assert.doesNotMatch(global, /FIXTURE-MIIT/);
    assert.doesNotMatch(cn, /id="comment-container"/); assert.match(global, /id="comment-container"/);
    assert.doesNotMatch(cn, /class="header-left-menu-list-item/); assert.match(global, /class="header-left-menu-list-item/);
    assert.match(cn, /Same article/); assert.match(global, /Same article/);
    const files = remote('cn', 'ls-tree', '-r', '--name-only', 'pages');
    assert.doesNotMatch(files, /private|build.json|_config|\.env/);
    assert.doesNotMatch(remote('cn', 'grep', '-I', '-n', '.', 'pages', '--', '*.html'), /PRIVATE-CONFIG-SENTINEL/);
    const sha = remote('cn', 'rev-parse', 'pages');
    ok(cli('multi-push', 'cn'));
    assert.equal(remote('cn', 'rev-parse', 'pages'), sha, 'repeat push must not commit');
    const history = n => JSON.parse(ok(cli('multi-history', n, '--json', '--silent')).stdout);
    assert.equal(history('cn')[0].result, 'unchanged');
    assert.equal(history('cn')[0].commit, sha);
    assert.equal(history('cn')[1].result, 'published');
    assert.equal(JSON.parse(ok(cli('multi-history', '--all', '--limit', '1', '--json', '--silent')).stdout).length, 1);
    fails(cli('multi-history', 'cn', '--limit', '0'), 'MULTI_TARGET');
    write('source/_posts/new.md', '---\ntitle: new\ndate: 2026-09-09\n---\nNew article');
    fails(cli('multi-push', 'cn'), 'MULTI_STALE');
    fails(cli('multi-push', 'cn', '--force'), 'MULTI_STALE');
    assert.equal(history('cn')[0].result, 'failed');
    assert.equal(history('cn')[0].error, 'MULTI_STALE');
    assert.equal(remote('cn', 'rev-parse', 'pages'), sha);
    ok(cli('multi-deploy', 'cn'));
    assert.notEqual(remote('cn', 'rev-parse', 'pages'), sha);
    assert.equal(remote('cn', 'rev-list', '--count', 'pages'), '2');
    assert.equal(fs.existsSync(path.join(site, 'public')), false, 'host public untouched');
    assert.equal(fs.existsSync(path.join(site, 'db.json')), false, 'host database untouched');
    console.log('Core publication cases passed; checking rejection and recovery paths.');
    const oldGlobal = remote('global', 'rev-parse', 'pages');
    fs.unlinkSync(path.join(site, 'source/_posts/new.md'));
    ok(cli('multi-generate', '--all'));
    const latest = JSON.parse(fs.readFileSync(path.join(site, 'plugins/multi_deploy/latest/cn.json')));
    const artifactFile = path.join(site, 'plugins/multi_deploy', latest.directory, 'artifact/review/index.html');
    const savedArtifact = fs.readFileSync(artifactFile);
    fs.appendFileSync(artifactFile, 'tampered');
    fails(cli('multi-push', '--all'), 'MULTI_ARTIFACT');
    fails(cli('multi-push', '--all', '--force'), 'MULTI_ARTIFACT');
    assert.equal(remote('global', 'rev-parse', 'pages'), oldGlobal);
    fs.writeFileSync(artifactFile, savedArtifact);
    ok(cli('multi-push', 'cn'));
    assert.doesNotMatch(remote('cn', 'ls-tree', '-r', '--name-only', 'pages'), /^new\//m, 'deleted article removed from destination');
    const afterDelete = remote('cn', 'rev-parse', 'pages');
    const rejectingHook = path.join(root, 'cn.git/hooks/pre-receive');
    fs.writeFileSync(rejectingHook, '#!/bin/sh\nexit 1\n', { mode: 0o700 });
    write('source/_posts/review.md', '---\ntitle: review\ndate: 2026-09-09\n---\n## Shared content\n\nChanged article.\n');
    ok(cli('multi-generate', 'cn'));
    fails(cli('multi-push', 'cn'), 'MULTI_GIT');
    assert.equal(remote('cn', 'rev-parse', 'pages'), afterDelete, 'receive-hook rejection must preserve remote');
    fs.unlinkSync(rejectingHook);
    ok(cli('multi-push', 'cn'));
    assert.match(remote('cn', 'show', 'pages:review/index.html'), /Changed article/);
    const beforeRetry = remote('cn', 'rev-parse', 'pages');
    fs.rmSync(path.join(site, 'plugins/multi_deploy/git'), { recursive: true });
    ok(cli('multi-push', 'cn'));
    assert.equal(remote('cn', 'rev-parse', 'pages'), beforeRetry, 'fresh Git cache must preserve remote history');
    // Advance the real destination after fetch but before this publisher's push.
    // The wrapper forwards every operation to system Git, only injecting a rival commit.
    const bin = path.join(root, 'bin'); fs.mkdirSync(bin);
    const realGit = run('sh', ['-c', 'command -v git']).stdout;
    fs.writeFileSync(path.join(bin, 'git'), `#!/bin/sh
case " $* " in
  *" ls-remote "*)
    if [ "$MULTI_FAIL_VERIFY" = 1 ] && [ -e "$MULTI_PUSH_FLAG" ]; then exit 75; fi ;;
  *" push "*)
    if [ "$MULTI_FAIL_VERIFY" = 1 ]; then : > "$MULTI_PUSH_FLAG"; fi
    if [ "$MULTI_RACE_ONCE" = 1 ] && [ ! -e "$MULTI_RACE_FLAG" ]; then
      : > "$MULTI_RACE_FLAG"
      previous=$("$MULTI_REAL_GIT" --git-dir "$MULTI_RACE_REPO" rev-parse refs/heads/pages)
      tree=$("$MULTI_REAL_GIT" --git-dir "$MULTI_RACE_REPO" rev-parse "$previous^{tree}")
      next=$(printf 'Concurrent publication\\n\\nDoratiger-Target: cn\\n' | "$MULTI_REAL_GIT" --git-dir "$MULTI_RACE_REPO" commit-tree "$tree" -p "$previous")
      "$MULTI_REAL_GIT" --git-dir "$MULTI_RACE_REPO" update-ref refs/heads/pages "$next" "$previous"
    fi ;;
esac
exec "$MULTI_REAL_GIT" "$@"
`, { mode: 0o700 });
    write('source/_posts/race.md', '---\ntitle: race\ndate: 2026-09-09\n---\nConcurrent publication test');
    ok(cli('multi-generate', 'cn'));
    const originalPath = env.PATH;
    Object.assign(env, { PATH: `${bin}:${originalPath}`, MULTI_REAL_GIT: realGit, MULTI_RACE_ONCE: '1', MULTI_RACE_FLAG: path.join(root, 'raced'), MULTI_RACE_REPO: path.join(root, 'cn.git') });
    fails(cli('multi-push', 'cn'), 'MULTI_GIT');
    env.PATH = originalPath; delete env.MULTI_RACE_ONCE;
    const rival = remote('cn', 'rev-parse', 'pages');
    assert.notEqual(rival, beforeRetry);
    ok(cli('multi-push', 'cn'));
    assert.equal(remote('cn', 'rev-parse', 'pages^'), rival, 'retry must preserve concurrent remote commit');
    write('source/_posts/force.md', '---\ntitle: force\ndate: 2026-09-09\n---\nForce publication test');
    ok(cli('multi-generate', 'cn'));
    const beforeForce = remote('cn', 'rev-parse', 'pages');
    Object.assign(env, { PATH: `${bin}:${originalPath}`, MULTI_RACE_ONCE: '1', MULTI_RACE_FLAG: path.join(root, 'force-raced') });
    ok(cli('multi-push', 'cn', '--force'));
    env.PATH = originalPath; delete env.MULTI_RACE_ONCE;
    assert.equal(fs.existsSync(path.join(root, 'force-raced')), true);
    assert.equal(remote('cn', 'rev-parse', 'pages^'), beforeForce, 'explicit force may overwrite the concurrent commit');
    write('source/_posts/uncertain.md', '---\ntitle: uncertain\ndate: 2026-09-09\n---\nVerification interrupted');
    ok(cli('multi-generate', 'cn'));
    Object.assign(env, { PATH: `${bin}:${originalPath}`, MULTI_FAIL_VERIFY: '1', MULTI_PUSH_FLAG: path.join(root, 'pushed') });
    fails(cli('multi-push', 'cn'), 'MULTI_GIT');
    env.PATH = originalPath; delete env.MULTI_FAIL_VERIFY;
    assert.equal(history('cn')[0].result, 'unconfirmed');
    assert.equal(history('cn')[0].phase, 'verify-remote');
    assert.equal(history('cn')[0].commit, remote('cn', 'rev-parse', 'pages'), 'failed verification must not misreport an accepted push as failed');
    ok(cli('multi-push', 'cn'));
    assert.equal(history('cn')[0].result, 'unchanged');
    const clone = path.join(root, 'unknown');
    git(['clone', '--branch', 'pages', path.join(root, 'cn.git'), clone]);
    git(['commit', '--allow-empty', '-m', 'Unmanaged change'], clone);
    git(['push', 'origin', 'HEAD:pages'], clone);
    const unmanaged = remote('cn', 'rev-parse', 'pages');
    fails(cli('multi-push', 'cn'), 'MULTI_OWNERSHIP');
    assert.equal(remote('cn', 'rev-parse', 'pages'), unmanaged);
    ok(cli('multi-push', 'cn', '--force', '--dry-run'));
    assert.equal(remote('cn', 'rev-parse', 'pages'), unmanaged);
    ok(cli('multi-push', 'cn', '--force'));
    assert.match(remote('cn', 'show', '-s', '--format=%B', 'pages'), /Doratiger-Target: cn/);
    assert.equal(remote('cn', 'rev-parse', 'pages^'), unmanaged, 'force adoption should retain the fetched history');
    const adopted = remote('cn', 'rev-parse', 'pages');
    ok(cli('multi-push', 'cn'));
    assert.equal(remote('cn', 'rev-parse', 'pages'), adopted);
    for (const invalid of [{ site: { theme_config: {} } }, { theme: { multi_deploy: {} } }, { mystery: {} }, { site: { source_dir: '../outside' } }, { site: { render_drafts: true } }]) {
        write('doratiger_config.cn.yml', invalid);
        fails(cli('multi-generate', 'cn'), 'MULTI_CONFIG');
    }
    write('doratiger_config.cn.yml', { site: { url: 'https://cn.example.test', root: '/' }, theme: { comment: { enable: false } } });
    themeConfig.multi_deploy.targets.global.publish.repo = path.join(root, 'cn.git');
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    fails(cli('multi-generate', '--all'), 'MULTI_CONFIG');
    themeConfig.multi_deploy.targets.global.publish.repo = path.join(root, 'global.git');
    themeConfig.multi_deploy.work_dir = 'source/escape';
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    fails(cli('multi-generate', 'cn'), 'MULTI_PATH');
    delete themeConfig.multi_deploy.work_dir;
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    fs.symlinkSync(path.join(root, 'cn.git'), path.join(site, 'source/escape'));
    fails(cli('multi-generate', 'cn'), 'MULTI_PATH');
    fs.unlinkSync(path.join(site, 'source/escape'));
    write('plugins/multi_deploy/lock', { pid: 123, host: 'fixture' });
    fails(cli('multi-generate', 'cn'), 'MULTI_LOCK');
    fs.unlinkSync(path.join(site, 'plugins/multi_deploy/lock'));
    // Ordinary Hexo commands must not load any target profile by filename.
    write('doratiger_config.cn.yml', 'INVALID: [');
    ok(cli('generate'));
    const normal = fs.readFileSync(path.join(site, 'public/review/index.html'), 'utf8');
    assert.match(normal, /https:\/\/base.example.test/);
    assert.match(normal, /id="comment-container"/);
    const originalConfig = fs.readFileSync(path.join(site, '_config.yml'), 'utf8');
    write('themes/other/_config.yml', {});
    write('themes/other/layout/index.pug', 'doctype html\nhtml\n  body= config.url\n');
    write('themes/other/layout/post.pug', 'doctype html\nhtml\n  body= page.title\n');
    write('_config.yml', { ...JSON.parse(originalConfig), theme: 'other' });
    ok(cli('clean')); ok(cli('generate'));
    assert.match(fs.readFileSync(path.join(site, 'public/index.html'), 'utf8'), /https:\/\/base.example.test/);
    assert.doesNotMatch(ok(cli('--help')).output, /multi-generate/, 'another theme must not register these commands or load malformed target YAML');
    write('_config.yml', originalConfig);
    write('doratiger_config.cn.yml', { site: { url: 'https://cn.example.test', root: '/' }, theme: { comment: { enable: false } } });
    const beforeFailure = ['cn', 'global'].map(n => remote(n, 'rev-parse', 'pages'));
    write('scripts/failing-generator.js', "hexo.extend.generator.register('fixture-failure', () => { throw new Error('PRIVATE-CONFIG-SENTINEL'); });");
    const failedBuild = cli('multi-deploy', '--all');
    assert.equal(history('cn')[0].result, 'failed');
    assert.equal(history('global')[0].result, 'skipped');
    fails(failedBuild, 'MULTI_BUILD');
    assert.doesNotMatch(failedBuild.output, /PRIVATE-CONFIG-SENTINEL/);
    assert.deepEqual(['cn', 'global'].map(n => remote(n, 'rev-parse', 'pages')), beforeFailure, 'build failure must not publish any selected target');
    fs.unlinkSync(path.join(site, 'scripts/failing-generator.js'));
    // Reuse an existing manifest without making any Qiniu requests.
    themeConfig.cdn_image = { enable: true, provider: 'qiniu', public_base_url: 'https://cdn.example.test', key_prefix: 'images', qiniu: { bucket: 'fixture', access_key: 'PRIVATE-CONFIG-SENTINEL', secret_key: 'PRIVATE-CONFIG-SENTINEL' } };
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    const picture = path.join(site, 'source/images/photo.png'); fs.mkdirSync(path.dirname(picture), { recursive: true });
    fs.copyFileSync(path.join(theme, 'source/images/police_beian.png'), picture);
    write('source/_posts/photo.md', '---\ntitle: photo\ndate: 2026-09-09\n---\n![photo](/images/photo.png)');
    write('plugins/cdn_image/.hexo-cdn-image-manifest.json', { version: 1, provider: 'qiniu', bucket: 'fixture', publicBaseUrl: 'https://cdn.example.test', entries: { 'images/photo.png': { objectKey: 'images/images/photo.png', sha256: 'fixture' } } });
    ok(cli('multi-generate', 'cn'));
    const cdnLatest = JSON.parse(fs.readFileSync(path.join(site, 'plugins/multi_deploy/latest/cn.json')));
    assert.match(fs.readFileSync(path.join(site, 'plugins/multi_deploy', cdnLatest.directory, 'artifact/photo/index.html'), 'utf8'), /https:\/\/cdn.example.test\/images\/images\/photo.png/);
    write('doratiger_config.cn.yml', { theme: { cdn_image: { qiniu: { bucket: 'wrong' } } } });
    fails(cli('multi-generate', 'cn'), 'MULTI_CDN');
    write('doratiger_config.cn.yml', { site: { url: 'https://cn.example.test', root: '/' }, theme: { comment: { enable: false } } });
    themeConfig.cdn_image.enable = false;
    write('_config.hexo-theme-doratiger.yml', themeConfig);
    ok(cli('multi-deploy', '--all'));
    for (const n of ['cn', 'global']) assert.equal(run('git', ['--git-dir', path.join(root, `${n}.git`), 'grep', '-I', '-l', 'PRIVATE-CONFIG-SENTINEL', 'pages']).status, 1, 'private YAML/CDN keys must not appear in any published text file');
    const state = path.join(site, 'plugins/multi_deploy');
    const globalPointer = JSON.parse(fs.readFileSync(path.join(state, 'latest/global.json')));
    ok(cli('multi-generate', 'cn'));
    const cnPointer = JSON.parse(fs.readFileSync(path.join(state, 'latest/cn.json')));
    const beforeHistory = history('cn');
    ok(cli('multi-push', 'cn', '--dry-run'));
    assert.deepEqual(history('cn'), beforeHistory);
    // History is local: neither the profile contents nor stale inputs matter.
    const profile = fs.readFileSync(path.join(site, 'doratiger_config.cn.yml'));
    write('doratiger_config.cn.yml', 'broken: [');
    assert.deepEqual(history('cn'), beforeHistory);
    fs.writeFileSync(path.join(site, 'doratiger_config.cn.yml'), profile);
    const beforeClean = fs.readdirSync(path.join(state, 'runs')).sort();
    ok(cli('multi-clean', 'cn'));
    assert.deepEqual(fs.readdirSync(path.join(state, 'runs')).sort(), beforeClean);
    fails(cli('multi-clean', 'cn', '--apply'), 'MULTI_CONFIRM');
    fails(cli('multi-clean', 'cn', '--force'), 'MULTI_TARGET');
    fs.writeFileSync(path.join(state, 'lock'), '{}');
    fails(cli('multi-clean', 'cn', '--apply', '--yes'), 'MULTI_LOCK');
    fs.unlinkSync(path.join(state, 'lock'));
    fs.mkdirSync(path.join(state, 'unexpected-user-data'));
    fails(cli('multi-clean', 'cn', '--apply', '--yes'), 'MULTI_PATH');
    fs.rmdirSync(path.join(state, 'unexpected-user-data'));
    fs.symlinkSync(path.join(site, 'source'), path.join(state, 'git/cn/attempt-escape'));
    fails(cli('multi-clean', 'cn', '--apply', '--yes'), 'MULTI_PATH');
    fs.unlinkSync(path.join(state, 'git/cn/attempt-escape'));
    const refs = ['cn', 'global'].map(n => remote(n, 'rev-parse', 'pages'));
    const globalHistory = history('global');
    ok(cli('multi-clean', 'cn', '--apply', '--yes'));
    assert.equal(history('cn').length, 2);
    assert.deepEqual(history('global'), globalHistory, 'single-target cleanup must preserve other histories');
    assert.ok(fs.existsSync(path.join(state, globalPointer.directory, 'artifact/index.html')));
    assert.ok(fs.existsSync(path.join(state, globalPointer.directory, '../input')), 'shared snapshot retained for global');
    assert.ok(fs.existsSync(path.join(state, cnPointer.directory, 'artifact/index.html')));
    assert.equal(fs.existsSync(path.join(state, 'git/cn')), false);
    assert.deepEqual(['cn', 'global'].map(n => remote(n, 'rev-parse', 'pages')), refs, 'cleanup must not publish');
    ok(cli('multi-push', 'cn'));
    const afterCleanupPush = ['cn', 'global'].map(n => remote(n, 'rev-parse', 'pages'));
    ok(cli('multi-clean', '--all', '--apply', '--yes'));
    assert.deepEqual(['cn', 'global'].map(n => remote(n, 'rev-parse', 'pages')), afterCleanupPush);
    assert.ok(history('cn').length <= 2 && history('global').length <= 2);
    console.log('PASS: local history, dry-run, retention, shared snapshots, lock and ownership safeguards.');
    console.log('PASS: actual Hexo CLI multi-target build, local bare Git publication, no-op push, stale inputs and host isolation.');
    if (process.env.MULTI_KEEP_FIXTURE) console.log(`FIXTURE=${root}`);
} finally {
    if (!process.env.MULTI_KEEP_FIXTURE) fs.rmSync(root, { recursive: true, force: true });
}

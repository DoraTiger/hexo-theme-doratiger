'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { inventory, apply } = require('../scripts/utils/multi-deploy/cleanup');
const { begin, entries } = require('../scripts/utils/multi-deploy/history');
const { acquire } = require('../scripts/utils/multi-deploy/workspace');
const { json } = require('../scripts/utils/multi-deploy/files');

function fixture(t) {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-maintenance-'));
    t.after(() => fs.rmSync(base, { recursive: true, force: true }));
    const plan = { base, work: path.join(base, 'state'), targets: [{ name: 'cn' }], cleanup: { keep_builds: 1, keep_records: 1 }, all: true };
    acquire(plan)();
    return plan;
}
function build(plan, name, date, id = crypto.randomUUID()) {
    const directory = path.join(plan.work, 'runs', id, name);
    json(path.join(directory, 'build.json'), { schema: 1, target: name, created_at: date });
    json(path.join(directory, 'artifact/index.html'), 'fixture');
    json(path.join(directory, '../input/config.json'), {});
    return directory;
}
test('cleanup protects an older latest pointer in addition to the newest retained build', t => {
    const plan = fixture(t);
    const pinned = build(plan, 'cn', '2026-01-01');
    const old = build(plan, 'cn', '2026-02-01');
    const newest = build(plan, 'cn', '2026-03-01');
    json(path.join(plan.work, 'latest/cn.json'), { directory: path.relative(plan.work, pinned) });
    const release = acquire(plan);
    try { apply(plan, inventory(plan)); } finally { release(); }
    assert.ok(fs.existsSync(pinned)); assert.ok(fs.existsSync(newest)); assert.equal(fs.existsSync(old), false);
});
test('cleanup preserves shared input and another target while discarding an incomplete selected build', t => {
    const plan = fixture(t), id = crypto.randomUUID();
    const global = build(plan, 'global', '2026-01-01', id);
    const partial = path.join(plan.work, 'runs', id, 'cn');
    json(path.join(partial, 'site/_config.yml'), {});
    const release = acquire(plan);
    try { apply(plan, inventory(plan)); } finally { release(); }
    assert.equal(fs.existsSync(partial), false);
    assert.ok(fs.existsSync(global)); assert.ok(fs.existsSync(path.join(global, '../input/config.json')));
});
test('a record interrupted after push intent remains unconfirmed with its commit', t => {
    const plan = fixture(t);
    const record = begin(plan, { name: 'cn', publish: { branch: 'pages', token: '$TOKEN', message: 'PRIVATE' } }, 'push', true);
    record.update({ phase: 'push', commit: 'a'.repeat(40) });
    const saved = entries(plan)[0].value;
    assert.equal(saved.result, 'unconfirmed'); assert.equal(saved.finished_at, null);
    assert.equal(saved.commit, 'a'.repeat(40)); assert.equal(saved.force, true);
    assert.equal(JSON.stringify(saved).includes('PRIVATE'), false); assert.equal(JSON.stringify(saved).includes('TOKEN'), false);
});
test('cleanup refuses a forged latest pointer before deleting any files', t => {
    const plan = fixture(t), directory = build(plan, 'cn', '2026-01-01');
    json(path.join(plan.work, 'latest/cn.json'), { directory: '../../source' });
    assert.throws(() => inventory(plan), /MULTI_PATH/);
    assert.ok(fs.existsSync(directory));
});
test('history remains readable when unrelated runtime artifacts contain an unsafe link', async t => {
    const plan = fixture(t);
    begin(plan, { name: 'cn', publish: { branch: 'pages' } }, 'push', false);
    fs.symlinkSync(plan.base, path.join(plan.work, 'unrelated-link'));
    const hexo = { base_dir: plan.base, theme_dir: path.join(plan.base, 'theme'), public_dir: path.join(plan.base, 'public'), config: { theme: 'theme', language: 'en' }, doratiger: { config: { multi_deploy: { enable: true, work_dir: 'state', targets: { cn: {} } } } } };
    await require('../scripts/console/lib/multi-maintenance')(hexo, 'history', { _: ['cn'], json: true });
});
test('interrupted atomic record and pointer writes do not block history or cleanup', t => {
    const plan = fixture(t);
    const record = begin(plan, { name: 'cn', publish: { branch: 'pages' } }, 'push', false);
    const temporaryRecord = path.join(plan.work, 'history/cn', `${record.value.id}.json.${crypto.randomUUID()}.tmp`);
    const temporaryPointer = path.join(plan.work, 'latest', `cn.json.${crypto.randomUUID()}.tmp`);
    fs.mkdirSync(path.dirname(temporaryPointer), { recursive: true });
    fs.writeFileSync(temporaryRecord, '{'); fs.writeFileSync(temporaryPointer, '{');
    assert.equal(entries(plan).length, 1);
    const release = acquire(plan);
    try { apply(plan, inventory(plan)); } finally { release(); }
    assert.equal(fs.existsSync(temporaryRecord), false); assert.equal(fs.existsSync(temporaryPointer), false);
    assert.equal(entries(plan).length, 1);
});
test('cleanup refuses an unknown file inside a run target instead of treating it as an incomplete build', t => {
    const plan = fixture(t);
    const file = path.join(plan.work, 'runs', crypto.randomUUID(), 'cn/manual-notes.txt');
    json(file, 'user notes');
    assert.throws(() => inventory(plan), /MULTI_PATH/);
    assert.ok(fs.existsSync(file));
});
test('cleanup refuses a nonempty Git attempt without Git ownership structure', t => {
    const plan = fixture(t);
    const file = path.join(plan.work, 'git/cn/attempt-Abc123/manual-notes.txt');
    json(file, 'user notes');
    assert.throws(() => inventory(plan), /MULTI_PATH/);
    assert.ok(fs.existsSync(file));
});

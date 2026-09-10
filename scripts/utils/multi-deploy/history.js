'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { json, read, noLinks, walk } = require('./files');
const { fail } = require('./errors');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const namePattern = /^[a-z][a-z0-9_-]{0,47}$/;
const results = ['unconfirmed', 'published', 'unchanged', 'failed', 'skipped'];
function temporary(name, validBase) {
    const match = name.match(/^(.+)\.([0-9a-f-]{36})\.tmp$/);
    return !!match && uuid.test(match[2]) && validBase(match[1]);
}
const recordTemp = name => temporary(name, base => base.endsWith('.json') && uuid.test(base.slice(0, -5)));

function begin(plan, target, action, force) {
    const value = {
        schema: 1, id: crypto.randomUUID(), target: target.name, action,
        started_at: new Date().toISOString(), finished_at: null,
        branch: target.publish.branch, force: !!force, artifact: null, commit: null,
        phase: 'queued', result: 'unconfirmed', error: null,
    };
    const file = path.join(plan.work, 'history', target.name, `${value.id}.json`);
    json(file, value);
    return {
        value,
        update(fields) { Object.assign(value, fields); json(file, value); },
        finish(result, fields = {}) { this.update({ ...fields, result, finished_at: new Date().toISOString() }); },
    };
}
function entries(plan, names = plan.targets.map(t => t.name)) {
    const root = path.join(plan.work, 'history');
    if (!fs.existsSync(root)) return [];
    noLinks(root); walk(root);
    const items = [];
    for (const name of fs.readdirSync(root)) {
        if (!namePattern.test(name)) fail('PATH');
        for (const fileName of fs.readdirSync(path.join(root, name))) {
            if (recordTemp(fileName)) continue;
            if (!fileName.endsWith('.json') || !uuid.test(fileName.slice(0, -5))) fail('PATH');
            const file = path.join(root, name, fileName), value = read(file, 'PATH');
            if (value.schema !== 1 || value.target !== name || `${value.id}.json` !== fileName || !results.includes(value.result) || !Number.isFinite(Date.parse(value.started_at))) fail('PATH');
            if (names.includes(name)) items.push({ file, value });
        }
    }
    return items.sort((a, b) => b.value.started_at.localeCompare(a.value.started_at) || b.value.id.localeCompare(a.value.id));
}
module.exports = { begin, entries, uuid, namePattern, temporary, recordTemp };

'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { inputs } = require('../scripts/utils/multi-deploy/workspace');

test('content directories named public and db.json are not mistaken for host or theme runtime data', t => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'multi-inputs-'));
    t.after(() => fs.rmSync(base, { recursive: true }));
    const themeName = 'fixture';
    const theme = path.join(base, 'themes', themeName);
    const source = path.join(base, 'source');
    for (const name of [
        'source/tools/public/index.html', 'source/tools/db.json',
        'themes/fixture/source/tools/public/data.txt', 'themes/fixture/source/db.json',
        'public/old.html', 'db.json', 'themes/fixture/public/old.html', 'themes/fixture/db.json',
        'source/tools/.env', 'source/tools/.env.production', 'source/tools/.git/config',
        'themes/fixture/source/tools/.env', 'source/tools/node_modules/private.txt',
    ]) {
        const file = path.join(base, name);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, 'fixture');
    }
    const wanted = [
        'source/tools/db.json', 'source/tools/public/index.html',
        'themes/fixture/source/db.json', 'themes/fixture/source/tools/public/data.txt',
    ].sort();
    for (const metadataOnly of [false, true]) {
        assert.deepEqual(inputs({ base, source, theme, themeName }, metadataOnly).map(e => e.name).sort(), wanted);
    }
});

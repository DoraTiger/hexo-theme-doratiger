'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { inspect } = require('./workspace');
const { read, inside, noLinks } = require('./files');
const { entries, uuid, namePattern, temporary, recordTemp } = require('./history');
const { fail } = require('./errors');

const children = directory => fs.existsSync(directory) ? fs.readdirSync(directory) : [];
function bytes(file) {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) return 0; // Only the validated node_modules link is allowed.
    return stat.isDirectory() ? children(file).reduce((n, child) => n + bytes(path.join(file, child)), 0) : stat.size;
}
function inventory(plan) {
    if (!inspect(plan)) return { remove: [], keep: [], bytes: 0 };
    const selected = new Set(plan.targets.map(t => t.name));
    for (const name of children(plan.work)) if (!['owner.json', 'lock', 'runs', 'latest', 'git', 'history'].includes(name)) fail('PATH');
    const pinned = new Set(), temporaryPointers = [];
    for (const file of children(path.join(plan.work, 'latest'))) {
        if (temporary(file, base => base.endsWith('.json') && namePattern.test(base.slice(0, -5)))) {
            if (selected.has(file.split('.json.')[0])) temporaryPointers.push(path.join(plan.work, 'latest', file));
            continue;
        }
        const name = file.slice(0, -5);
        if (!file.endsWith('.json') || !namePattern.test(name)) fail('PATH');
        const pointer = read(path.join(plan.work, 'latest', file), 'PATH');
        if (typeof pointer.directory !== 'string' || !new RegExp(`^runs/[0-9a-f-]{36}/${name}$`).test(pointer.directory)) fail('PATH');
        const directory = path.join(plan.work, pointer.directory);
        const record = read(path.join(directory, 'build.json'), 'PATH');
        if (record.schema !== 1 || record.target !== name || !fs.statSync(path.join(directory, 'artifact')).isDirectory()) fail('PATH');
        pinned.add(directory);
    }
    const runs = [], builds = [];
    for (const id of children(path.join(plan.work, 'runs'))) {
        if (!uuid.test(id)) fail('PATH');
        const directory = path.join(plan.work, 'runs', id), targets = [];
        for (const name of children(directory)) {
            if (name === 'input') {
                if (!fs.statSync(path.join(directory, name)).isDirectory()) fail('PATH');
                continue;
            }
            if (!namePattern.test(name)) fail('PATH');
            const targetDir = path.join(directory, name);
            if (!fs.statSync(targetDir).isDirectory()) fail('PATH');
            for (const child of children(targetDir)) {
                const stat = fs.statSync(path.join(targetDir, child));
                if (['site', 'artifact'].includes(child)) { if (!stat.isDirectory()) fail('PATH'); }
                else if (child === 'build.json' || temporary(child, base => base === 'build.json')) { if (!stat.isFile()) fail('PATH'); }
                else fail('PATH');
            }
            const recordFile = path.join(targetDir, 'build.json');
            let time = null;
            if (fs.existsSync(recordFile)) {
                const record = read(recordFile, 'PATH');
                if (record.schema !== 1 || record.target !== name) fail('PATH');
                time = record.created_at ? Date.parse(record.created_at) : fs.statSync(recordFile).mtimeMs;
                if (!Number.isFinite(time) || !fs.statSync(path.join(targetDir, 'artifact')).isDirectory()) fail('PATH');
            }
            const item = { name, directory: targetDir, time };
            targets.push(item); builds.push(item);
        }
        runs.push({ directory, targets });
    }
    const retained = new Set(pinned);
    for (const name of selected) {
        const complete = builds.filter(b => b.name === name && b.time !== null).sort((a, b) => b.time - a.time || a.directory.localeCompare(b.directory));
        for (const b of complete.slice(0, plan.cleanup.keep_builds)) retained.add(b.directory);
    }
    const remove = [], keep = [];
    const add = (file, reason) => remove.push({ path: path.relative(plan.work, file), bytes: bytes(file), reason });
    for (const run of runs) {
        const survivors = run.targets.filter(b => !selected.has(b.name) || retained.has(b.directory));
        if (!survivors.length && (run.targets.length || plan.all)) add(run.directory, 'old-run');
        else {
            for (const b of run.targets) {
                if (!survivors.includes(b)) add(b.directory, b.time === null ? 'incomplete-build' : 'old-build');
                else keep.push({ path: path.relative(plan.work, b.directory), reason: !selected.has(b.name) ? 'other-target' : pinned.has(b.directory) ? 'latest' : 'retention' });
            }
            keep.push({ path: path.relative(plan.work, run.directory), reason: 'shared-input' });
        }
    }
    for (const name of children(path.join(plan.work, 'git'))) {
        if (!namePattern.test(name)) fail('PATH');
        const directory = path.join(plan.work, 'git', name);
        if (children(directory).some(n => !/^attempt-[A-Za-z0-9]+$/.test(n))) fail('PATH');
        for (const attempt of children(directory)) {
            const attemptDir = path.join(directory, attempt);
            if (!fs.statSync(attemptDir).isDirectory()) fail('PATH');
            if (children(attemptDir).length) {
                const metadata = path.join(attemptDir, '.git');
                if (!fs.existsSync(metadata) || !fs.statSync(metadata).isDirectory() || !fs.existsSync(path.join(metadata, 'config')) || !fs.statSync(path.join(metadata, 'config')).isFile()) fail('PATH');
            }
        }
        if (selected.has(name)) add(directory, 'git-attempts');
    }
    const records = entries(plan);
    for (const name of selected) for (const item of records.filter(e => e.value.target === name).slice(plan.cleanup.keep_records)) add(item.file, 'old-record');
    for (const name of selected) for (const file of children(path.join(plan.work, 'history', name))) if (recordTemp(file)) {
        const full = path.join(plan.work, 'history', name, file);
        if (!fs.statSync(full).isFile()) fail('PATH');
        add(full, 'atomic-temp');
    }
    for (const file of temporaryPointers) {
        if (!fs.statSync(file).isFile()) fail('PATH');
        add(file, 'atomic-temp');
    }
    return { remove, keep, bytes: remove.reduce((sum, item) => sum + item.bytes, 0) };
}
function apply(plan, listing) {
    // Called only while holding the same workspace lock as builds and pushes.
    inspect(plan);
    for (const item of listing.remove) {
        const file = path.resolve(plan.work, item.path);
        const pointerTemp = item.path.startsWith('latest/') && temporary(path.basename(file), base => base.endsWith('.json') && namePattern.test(base.slice(0, -5)));
        if (!inside(plan.work, file) || (!/^(runs|git|history)\//.test(item.path) && !pointerTemp)) fail('PATH');
        noLinks(file);
        fs.rmSync(file, { recursive: true });
    }
}
module.exports = { inventory, apply };

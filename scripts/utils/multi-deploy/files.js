'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { fail } = require('./errors');

const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const inside = (root, file) => { const p = path.relative(root, file); return p !== '' && p !== '..' && !p.startsWith(`..${path.sep}`) && !path.isAbsolute(p); };
function real(file) {
    const resolved = path.resolve(file);
    return fs.existsSync(resolved) ? fs.realpathSync(resolved) : path.join(real(path.dirname(resolved)), path.basename(resolved));
}
function noLinks(file) {
    let current = path.resolve(file);
    while (true) {
        if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) fail('PATH');
        const parent = path.dirname(current);
        if (current === parent) break;
        current = parent;
    }
}
function mkdir(file) { fs.mkdirSync(file, { recursive: true, mode: 0o700 }); }
function json(file, value) {
    mkdir(path.dirname(file));
    const temp = `${file}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
    fs.renameSync(temp, file);
}
function read(file, code = 'CONFIG') {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { fail(code); }
}
function walk(root, exclude = () => false) {
    const result = [];
    function visit(file, name) {
        if (exclude(name)) return;
        const stat = fs.lstatSync(file);
        if (stat.isSymbolicLink()) fail('PATH');
        if (stat.isDirectory()) for (const n of fs.readdirSync(file).sort()) visit(path.join(file, n), name ? `${name}/${n}` : n);
        else if (stat.isFile()) result.push({ name, file, stat });
        else fail('PATH');
    }
    visit(root, '');
    return result;
}
function copy(source, destination, exclude) {
    mkdir(destination);
    for (const { name, file, stat } of walk(source, exclude)) {
        const dest = path.join(destination, name); mkdir(path.dirname(dest));
        fs.copyFileSync(file, dest); fs.chmodSync(dest, stat.mode & 0o111 ? 0o700 : 0o600);
        fs.utimesSync(dest, stat.atime, stat.mtime);
    }
}
function tree(root) {
    return walk(root).map(({ name, file, stat }) => {
        if (name.split('/').some(n => n === '.git' || n === '.env' || n.startsWith('.env.') || /^_config.*\.(yml|yaml|json)$/.test(n) || n === 'build.json' || /^doratiger_config\..*\.yml$/.test(n))) fail('ARTIFACT');
        return { name, hash: digest(fs.readFileSync(file)), executable: !!(stat.mode & 0o111) };
    });
}
module.exports = { digest, inside, real, noLinks, mkdir, json, read, walk, copy, tree };

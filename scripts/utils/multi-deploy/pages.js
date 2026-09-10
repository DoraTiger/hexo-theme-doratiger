'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { isIP } = require('node:net');
const { fail } = require('./errors');

// Explicit deployment adaptation, independent of the Git transport and URL.
function validate(pages) {
    if (pages === undefined) return;
    if (!pages || typeof pages !== 'object' || Array.isArray(pages) || pages instanceof Date ||
        Object.keys(pages).some(key => !['enable', 'cname'].includes(key)) ||
        (pages.enable !== undefined && typeof pages.enable !== 'boolean')) fail('PAGES_CONFIG');
    if (pages.cname !== undefined) {
        const domain = pages.cname;
        if (typeof domain !== 'string' || domain.length > 253 || isIP(domain) || !domain.includes('.') ||
            !domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) ||
            !/[a-z]/i.test(domain.split('.').pop())) fail('PAGES_CONFIG');
    }
}

function apply(output, source, pages) {
    if (pages?.enable !== true) return;
    if (pages.cname !== undefined) {
        const cname = pages.cname.toLowerCase();
        // Check both input and rendered output: excluded source files and
        // generator-provided CNAME must not be silently overwritten.
        for (const directory of [source, output]) {
            const file = path.join(directory, 'CNAME');
            if (!fs.existsSync(file)) continue;
            if (!fs.lstatSync(file).isFile() || fs.readFileSync(file, 'utf8').trim().toLowerCase() !== cname) fail('PAGES_CONFLICT');
        }
        const file = path.join(output, 'CNAME');
        if (!fs.existsSync(file)) fs.writeFileSync(file, `${cname}\n`, { flag: 'wx' });
    }
    const marker = path.join(output, '.nojekyll');
    if (fs.existsSync(marker)) {
        if (!fs.lstatSync(marker).isFile()) fail('PAGES_CONFLICT');
    } else fs.writeFileSync(marker, '', { flag: 'wx' });
}
module.exports = { validate, apply };

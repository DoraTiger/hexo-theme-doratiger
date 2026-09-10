'use strict';
const { git } = require('../process');
const { fail } = require('../errors');

function credentials(publish) {
    if (!publish.token) return null;
    const token = process.env[publish.token.slice(1)];
    if (!token || /[\x00-\x20\x7f]/.test(token)) fail('AUTH');
    return `Authorization: Basic ${Buffer.from(`${publish.username || 'git'}:${token}`).toString('base64')}`;
}

// The secret is only passed in a child environment, never in arguments, URLs,
// repository config, snapshots or records. Scope the header to this HTTPS URL.
async function remoteGit(args, directory, publish) {
    const header = credentials(publish);
    if (!header) return git(args, directory);
    const key = `http.${publish.repo}.extraHeader`;
    return git([
        '-c', `${key}=`,
        `--config-env=${key}=DORATIGER_GIT_AUTH_HEADER`,
        '-c', 'http.followRedirects=false',
        '-c', 'credential.helper=',
        ...args,
    ], directory, { DORATIGER_GIT_AUTH_HEADER: header });
}
module.exports = { credentials, remoteGit };

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { git } = require('../process');
const { mkdir, copy, tree, digest } = require('../files');
const { fail } = require('../errors');
const { credentials, remoteGit } = require('./git-auth');

async function validateDestination(target, base, identity = false) {
    await git(['check-ref-format', `refs/heads/${target.publish.branch}`], base);
    if (identity) {
        credentials(target.publish);
        target.identity = {};
        for (const role of ['AUTHOR', 'COMMITTER']) {
            const overrides = {};
            if (target.publish.name) overrides[`GIT_${role}_NAME`] = target.publish.name;
            if (target.publish.email) overrides[`GIT_${role}_EMAIL`] = target.publish.email;
            const value = await git(['var', `GIT_${role}_IDENT`], base, overrides);
            const match = value.match(/^(.+) <([^<>]+)> \d+ [+-]\d{4}$/);
            if (!match) fail('GIT');
            target.identity[`GIT_${role}_NAME`] = match[1];
            target.identity[`GIT_${role}_EMAIL`] = match[2];
        }
    }
}
async function publish(target, artifact, work, { force = false, progress = () => {} } = {}) {
    const { repo, branch } = target.publish;
    const parent = path.join(work, 'git', target.name); mkdir(parent);
    const directory = fs.mkdtempSync(path.join(parent, 'attempt-'));
    await git(['init', directory], work);
    await git(['config', 'core.hooksPath', '/dev/null'], directory);
    const ref = `refs/heads/${branch}`;
    const remote = args => remoteGit(args, directory, target.publish);
    const found = await remote(['ls-remote', '--refs', repo, ref]);
    let owned = false;
    if (found) {
        await remote(['fetch', '--no-tags', repo, ref]);
        const message = await git(['show', '-s', '--format=%B', 'FETCH_HEAD'], directory);
        owned = message.split('\n').includes(`Doratiger-Target: ${target.name}`);
        if (!owned && !force) fail('OWNERSHIP');
        await git(['checkout', '-b', 'publication', 'FETCH_HEAD'], directory);
    } else await git(['checkout', '--orphan', 'publication'], directory);
    // This fresh attempt directory is owned solely by the publisher. Never
    // operate on the user's source checkout or ordinary .deploy_git directory.
    for (const name of fs.readdirSync(directory)) if (name !== '.git') fs.rmSync(path.join(directory, name), { recursive: true, force: true });
    if (digest(JSON.stringify(tree(artifact.artifact))) !== artifact.treeHash) fail('ARTIFACT');
    copy(artifact.artifact, directory);
    await git(['add', '--all', '--', '.'], directory);
    const nextTree = await git(['write-tree'], directory);
    if (owned && nextTree === await git(['rev-parse', 'HEAD^{tree}'], directory)) return { status: 'unchanged', commit: await git(['rev-parse', 'HEAD'], directory) };
    await git(['commit', '--allow-empty', '-m', `${target.publish.message || `Publish ${target.name}`}\n\nDoratiger-Target: ${target.name}\nDoratiger-Artifact: ${artifact.treeHash}`], directory, target.identity);
    const commit = await git(['rev-parse', 'HEAD'], directory);
    progress({ phase: 'push', commit });
    await remote(['push', ...(force ? ['--force'] : []), repo, `HEAD:${ref}`]);
    progress({ phase: 'verify-remote', commit });
    const result = await remote(['ls-remote', '--refs', repo, ref]);
    if (result.split(/\s/)[0] !== commit) fail('GIT');
    return { status: 'published', commit };
}
module.exports = { validateDestination, publish };

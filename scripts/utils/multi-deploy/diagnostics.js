'use strict';
// Emit only allowlisted classifications: raw Git output may contain credentials,
// private repository names or secret-scanning bypass links.
const operations = new Set(['init', 'config', 'check-ref-format', 'var', 'ls-remote', 'fetch', 'show', 'checkout', 'add', 'write-tree', 'rev-parse', 'commit', 'push']);
function summarize(args, result, elapsedMs) {
    const output = result.output || '';
    let reason = 'git-failed';
    if (result.timedOut) reason = 'timeout';
    else if (result.oversized) reason = 'output-limit';
    else if (/GH013|GITHUB PUSH PROTECTION/.test(output)) reason = 'github-rule-rejection';
    else if (/Authentication failed|Permission denied \(publickey\)|could not read Username/i.test(output)) reason = 'authentication';
    else if (/non-fast-forward|fetch first/i.test(output)) reason = 'non-fast-forward';
    else if (/Could not resolve|Failed to connect|Connection reset|timed out/i.test(output)) reason = 'network';
    return { operation: args.find(value => operations.has(value)) || 'git', exitCode: result.status, elapsedMs, reason };
}
module.exports = { summarize };

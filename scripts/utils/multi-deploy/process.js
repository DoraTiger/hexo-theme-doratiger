'use strict';
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const { fail } = require('./errors');
const { summarize } = require('./diagnostics');

// Never pass configuration through a shell, or forward child output that may
// contain private YAML or credential-helper diagnostics.
function run(command, args, cwd, env = process.env, timeoutMs = 600000) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], shell: false });
        let output = '', stdout = '';
        const limit = 16 * 1024 * 1024;
        let oversized = false, timedOut = false;
        const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
        function append(value, out) {
            if (oversized) return;
            if (output.length + value.length > limit) { oversized = true; child.kill(); return; }
            output += value; if (out) stdout += value;
        }
        child.stdout.on('data', data => append(data.toString(), true));
        child.stderr.on('data', data => append(data.toString(), false));
        child.on('error', error => { clearTimeout(timer); reject(error); });
        child.on('close', status => { clearTimeout(timer); resolve({ status: oversized || timedOut ? -1 : status, stdout: stdout.trim(), output, oversized, timedOut }); });
    });
}
async function git(args, cwd, identity = {}) {
    let result;
    const started = Date.now();
    try {
        const env = { ...process.env, ...identity, GIT_TERMINAL_PROMPT: '0' };
        // Hooks/CI may export repository selectors. Keep auth/author variables,
        // but do not let an inherited index or worktree escape our dedicated cwd.
        for (const key of Object.keys(env)) if (/^GIT_(DIR|WORK_TREE|COMMON_DIR|INDEX_FILE|OBJECT_DIRECTORY|ALTERNATE_OBJECT_DIRECTORIES|PREFIX|CONFIG|CONFIG_PARAMETERS|CONFIG_COUNT|CONFIG_KEY_\d+|CONFIG_VALUE_\d+)$/.test(key)) delete env[key];
        // Git's tracing can bypass captured stderr and write secrets to files.
        for (const key of Object.keys(env)) if (/^GIT_(TRACE.*|CURL_VERBOSE)$/.test(key)) delete env[key];
        result = await run('git', ['-c', 'commit.gpgSign=false', '-c', 'core.autocrlf=false', ...args], cwd,
            env, 120000);
    } catch (error) {
        // ENOENT can also mean an invalid cwd; do not mislabel that as a
        // missing executable. Only diagnose Git absence with a valid cwd.
        let validCwd = false;
        try { validCwd = fs.statSync(cwd).isDirectory(); } catch { /* invalid cwd */ }
        if (error.code === 'ENOENT' && validCwd) fail('GIT_MISSING');
        fail('GIT');
    }
    if (result.status !== 0) {
        const error = new Error('MULTI_GIT');
        error.multiCode = 'GIT';
        error.diagnostic = summarize(args, result, Date.now() - started);
        throw error;
    }
    return result.stdout;
}
module.exports = { run, git };

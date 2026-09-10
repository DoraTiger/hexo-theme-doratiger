'use strict';
const { spawn } = require('node:child_process');

function start(prepared, options) {
    const args = [prepared.cli, 'server', '--port', String(options.port), '--ip', options.ip];
    if (options.static) args.push('--static');
    const child = spawn(process.execPath, args, { cwd: prepared.site, env: prepared.env, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let resolveReady, rejectReady, ready = false, stopping = false, tail = '';
    const error = code => Object.assign(new Error(`MULTI_${code}`), { multiCode: code });
    const started = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
    // Never retain or forward raw plugin diagnostics, which may contain YAML
    // secrets. Keep only a bounded window to recognize the CLI lifecycle.
    const consume = data => {
        tail = (tail + data.toString()).slice(-8192);
        if (/\b(?:ERROR|FATAL)\b/.test(tail)) {
            rejectReady(error(/Port .*used|EADDRINUSE/.test(tail) ? 'PORT' : 'SERVER'));
            child.kill('SIGTERM');
        } else if (!ready && /Hexo is running at/.test(tail)) {
            ready = true; clearTimeout(timer); resolveReady();
        }
    };
    child.stdout.on('data', consume); child.stderr.on('data', consume);
    const timer = setTimeout(() => { rejectReady(error('SERVER')); child.kill('SIGKILL'); }, 120000);
    const closed = new Promise(resolve => {
        child.once('error', () => { clearTimeout(timer); rejectReady(error('SERVER')); resolve(); });
        child.once('close', () => { clearTimeout(timer); if (!ready) rejectReady(error('SERVER')); resolve(); });
    });
    let stopPromise;
    const stop = () => {
        if (stopPromise) return stopPromise;
        stopping = true;
        stopPromise = (async () => {
            child.kill('SIGTERM');
            const force = setTimeout(() => child.kill('SIGKILL'), 3000);
            await closed; clearTimeout(force);
        })();
        return stopPromise;
    };
    return { ready: started, closed, stop, get stopping() { return stopping; } };
}
module.exports = { start };

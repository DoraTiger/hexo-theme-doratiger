'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { run } = require('../scripts/utils/multi-deploy/process');

test('timeout closes inherited pipes held by a child process', async () => {
    const started = Date.now();
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const result = await run(process.execPath, ['-e', `
        require('node:child_process').spawn(process.execPath,
            ['-e', 'setTimeout(() => {}, 3000)'], { stdio: 'inherit' });
        setTimeout(() => {}, 3000);
    `], process.cwd(), env, 300);
    assert.equal(result.timedOut, true);
    assert.equal(result.status, -1);
    assert.ok(Date.now() - started < 2000, 'must not wait for the grandchild to exit');
});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { git } = require('../scripts/utils/multi-deploy/process');
const { summarize } = require('../scripts/utils/multi-deploy/diagnostics');
const { describe } = require('../scripts/utils/multi-deploy/errors');
test('missing Git installation guidance is localized', () => {
    for (const language of ['en', 'zh-CN', 'zh-TW']) {
        const text = describe({ multiCode: 'GIT_MISSING' }, language);
        assert.match(text, /PATH/);
        assert.match(text, /git --version/);
    }
    assert.match(describe({ multiCode: 'GIT_MISSING' }, 'zh-CN'), /未安装/);
    assert.match(describe({ multiCode: 'GIT_MISSING' }, 'zh-TW'), /未安裝/);
});
test('push protection diagnostics never expose secret findings or bypass links', () => {
    assert.deepEqual(summarize(['push', 'PRIVATE_URL'], { status: 1, output: 'GH013 PRIVATE_SECRET https://private/bypass' }, 12),
        { operation: 'push', exitCode: 1, elapsedMs: 12, reason: 'github-rule-rejection' });
    assert.equal(summarize(['fetch'], { status: -1, timedOut: true }, 120000).reason, 'timeout');
    assert.equal(summarize(['fetch'], { status: 1, output: 'Permission denied (publickey)' }, 2).reason, 'authentication');
});
test('Git failures expose bounded diagnostics without raw arguments or stderr', async () => {
    await assert.rejects(git(['rev-parse', '--verify', 'PRIVATE_SENTINEL'], __dirname), error => {
        assert.equal(error.multiCode, 'GIT');
        assert.equal(error.diagnostic.operation, 'rev-parse');
        assert.equal(typeof error.diagnostic.exitCode, 'number');
        assert.equal(typeof error.diagnostic.elapsedMs, 'number');
        assert.ok(!JSON.stringify(error).includes('PRIVATE_SENTINEL'));
        return true;
    });
});

'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolve } = require('../../utils/multi-deploy/config');
const { capture } = require('../../utils/multi-deploy/server-snapshot');
const { prepare } = require('../../utils/multi-deploy/site');
const { run } = require('../../utils/multi-deploy/process');
const { fail, describe } = require('../../utils/multi-deploy/errors');
const { getBoolOption } = require('../../utils/args');

module.exports = async (hexo, options) => {
    let session;
    try {
        if (typeof options.target !== 'string' || options.all || options.draft || options.config || options._?.length || process.env.DORATIGER_MULTI_CONTEXT) fail('TARGET');
        const plan = resolve(hexo, { _: [options.target] }, false, true);
        const target = plan.targets[0];
        session = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-algolia-'));
        const snapshot = capture(plan, session);
        const { site, cli, env } = prepare(snapshot.plan, target, snapshot.input);
        hexo.log.info(`[algolia] target=${target.name}`);
        const generated = await run(process.execPath, [cli, 'generate'], site, env);
        if (generated.status !== 0 || /\b(?:ERROR|FATAL)\b/.test(generated.output)) fail('BUILD');
        const dryRun = getBoolOption(options, ['dry-run', 'd'], false);
        const clean = getBoolOption(options, ['clean', 'c'], true);
        const result = await run(process.execPath, [cli, 'algolia', '--clean', String(clean), ...(dryRun ? ['--dry-run'] : [])], site, env);
        // Index content can legitimately quote ERROR/FATAL log messages.
        if (result.status !== 0) fail('ALGOLIA');
        // Successful dry-run intentionally displays public index entries;
        // failed SDK diagnostics never escape the isolated command.
        hexo.log.info(result.stdout);
    } catch (error) {
        throw new Error(describe(error, hexo.config.language));
    } finally {
        if (session) fs.rmSync(session, { recursive: true, force: true });
    }
};

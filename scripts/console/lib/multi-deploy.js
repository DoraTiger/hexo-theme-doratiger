'use strict';
const { resolve } = require('../../utils/multi-deploy/config');
const { acquire, snapshot } = require('../../utils/multi-deploy/workspace');
const { build, verify } = require('../../utils/multi-deploy/build');
const { validateDestination, publish } = require('../../utils/multi-deploy/publishers/git');
const { describe, fail } = require('../../utils/multi-deploy/errors');
const { begin } = require('../../utils/multi-deploy/history');

module.exports = async (hexo, action, args = {}) => {
    let release;
    const states = {};
    const records = {};
    try {
        if (args.force && action !== 'push') fail('TARGET');
        const plan = resolve(hexo, args);
        for (const t of plan.targets) {
            states[t.name] = 'pending';
            await validateDestination(t, plan.base, action !== 'generate' && !args['dry-run']);
        }
        if (args['dry-run']) {
            for (const t of plan.targets) hexo.log.info(`[multi-${action}] ${t.name}: dry-run`);
            return;
        }
        release = acquire(plan);
        if (action !== 'generate') for (const t of plan.targets) records[t.name] = begin(plan, t, action, args.force);
        if (action !== 'push') {
            for (const record of Object.values(records)) record.update({ phase: 'snapshot' });
            const input = snapshot(plan);
            for (const record of Object.values(records)) record.update({ phase: 'queued' });
            for (const t of plan.targets) {
                states[t.name] = 'building';
                records[t.name]?.update({ phase: 'building' });
                hexo.log.info(`[multi-${action}] ${t.name}: building`);
                await build(plan, t, input);
                states[t.name] = 'built';
                records[t.name]?.update({ phase: 'built' });
            }
        }
        if (action !== 'generate') {
            // Complete local preflight for every selected artifact before the
            // first remote operation. Publish never falls back to generation.
            const artifacts = plan.targets.map(t => {
                records[t.name].update({ phase: 'validate-artifact' });
                const artifact = verify(plan, t);
                records[t.name].update({ phase: 'ready', artifact: artifact.treeHash });
                return artifact;
            });
            for (let i = 0; i < plan.targets.length; i++) {
                const t = plan.targets[i]; states[t.name] = 'publishing';
                records[t.name].update({ phase: 'publishing' });
                if (args.force) hexo.log.warn(`[multi-push] ${t.name}: ${describe({ multiCode: 'FORCE' }, hexo.config.language)}`);
                const result = await publish(t, artifacts[i], plan.work, { force: !!args.force, progress: fields => records[t.name].update(fields) });
                states[t.name] = result.status;
                records[t.name].finish(result.status, { phase: 'complete', commit: result.commit });
            }
        }
        for (const [name, state] of Object.entries(states)) hexo.log.info(`[multi-${action}] ${name}: ${state}`);
    } catch (error) {
        if ((args.debug || hexo.env?.debug) && error.diagnostic) {
            hexo.log.error(`[multi-debug] ${JSON.stringify(error.diagnostic)}`);
        }
        for (const record of Object.values(records)) if (!record.value.finished_at) {
            const uncertain = ['push', 'verify-remote'].includes(record.value.phase);
            const skipped = ['queued', 'built', 'ready'].includes(record.value.phase);
            // Persist only stable error codes, never Git/YAML diagnostics.
            try { record.finish(uncertain ? 'unconfirmed' : skipped ? 'skipped' : 'failed', { error: `MULTI_${error.multiCode || 'CONFIG'}` }); }
            catch { /* Keep the last atomic record; do not hide the original error. */ }
        }
        for (const [name, state] of Object.entries(states)) hexo.log.error(`[multi-${action}] ${name}: ${state}`);
        // Do not expose raw child/YAML errors containing private configuration.
        throw new Error(describe(error, hexo.config.language));
    } finally { if (release) release(); }
};

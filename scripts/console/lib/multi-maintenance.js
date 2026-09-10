'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { resolve } = require('../../utils/multi-deploy/config');
const { inspect, inspectOwner, acquire } = require('../../utils/multi-deploy/workspace');
const { entries } = require('../../utils/multi-deploy/history');
const { inventory, apply } = require('../../utils/multi-deploy/cleanup');
const { fail, describe, translate } = require('../../utils/multi-deploy/errors');

module.exports = async (hexo, action, args = {}) => {
    let release;
    try {
        if (args.force || (action === 'history' && (args.apply || args.yes)) || (action === 'clean' && (args.limit || args.json))) fail('TARGET');
        const plan = resolve(hexo, args, true); plan.all = !!args.all;
        const exists = action === 'history' ? inspectOwner(plan) : inspect(plan);
        if (action === 'history') {
            const limit = args.limit === undefined ? 20 : Number(args.limit);
            if (!Number.isSafeInteger(limit) || limit < 1) fail('TARGET');
            const values = (exists ? entries(plan) : []).slice(0, limit).map(e => e.value);
            if (args.json) console.log(JSON.stringify(values, null, 2));
            else if (!values.length) console.log(translate('EMPTY_HISTORY', hexo.config.language));
            else for (const r of values) console.log(`${r.started_at}  ${r.target}  ${r.action}  ${translate(r.result, hexo.config.language)}  ${r.commit || '-'}  ${r.error || '-'}`);
            return;
        }
        if ((args.apply && !args.yes) || (args.yes && !args.apply) || (args.apply && args['dry-run'])) fail('CONFIRM');
        if (exists && fs.existsSync(path.join(plan.work, 'lock'))) fail('LOCK');
        if (args.apply && exists) release = acquire(plan);
        const listing = inventory(plan);
        for (const item of listing.keep) console.log(`${translate('KEEP', hexo.config.language)}  ${item.path}  (${translate(item.reason, hexo.config.language)})`);
        for (const item of listing.remove) console.log(`${translate('REMOVE', hexo.config.language)}  ${item.path}  ${item.bytes} B  (${translate(item.reason, hexo.config.language)})`);
        if (args.apply && exists) apply(plan, listing);
        console.log(`${translate(args.apply ? 'CLEANED' : 'PREVIEW', hexo.config.language)}: ${listing.remove.length}, ${listing.bytes} B`);
    } catch (error) { throw new Error(describe(error, hexo.config.language)); }
    finally { if (release) release(); }
};

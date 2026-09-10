'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { snapshot } = require('./workspace');
const { json } = require('./files');

// Each preview attempt owns its partial snapshot. Retrying a save race must
// neither accumulate copies nor remove the site used by the current server.
function capture(plan, session) {
    const work = fs.mkdtempSync(path.join(session, 'attempt-'));
    const isolated = { ...plan, work };
    try {
        json(path.join(work, 'owner.json'), { schema: 1, base: plan.base, pid: process.pid });
        return { plan: isolated, work, input: snapshot(isolated) };
    } catch (error) {
        fs.rmSync(work, { recursive: true });
        throw error;
    }
}
module.exports = { capture };

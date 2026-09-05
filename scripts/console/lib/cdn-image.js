"use strict";

const { findPostBodyImages } = require("../../utils/cdn-image-assets.js");
const { getCdnImageConfig } = require("../../utils/cdn-image-config.js");
const { validateCdnImageConfig } = require("../../utils/cdn-image-config.js");
const { diffManifest, readManifest, writeManifestAtomically } = require("../../utils/cdn-image-manifest.js");
const { createQiniuProvider } = require("../../utils/cdn-image-qiniu.js");

function getAction(options) {
    const positional = Array.isArray(options && options._) ? options._ : [];
    return String(positional[0] || "check").toLowerCase();
}

function manifestIdentity(config) {
    return {
        provider: config.provider,
        bucket: config.qiniu.bucket,
        publicBaseUrl: config.publicBaseUrl,
    };
}

async function runCdnCommand(hexo, options = {}, callback) {
    try {
        const action = getAction(options);
        if (!["check", "sync", "prune"].includes(action)) {
            throw new Error(`unsupported CDN action: ${action}`);
        }

        await hexo.load();
        const config = getCdnImageConfig(hexo);
        if (!config.enabled) {
            throw new Error("CDN image feature is not enabled");
        }

        let manifest = readManifest(config.manifestPath);
        const assets = await findPostBodyImages(hexo);
        if (action === "sync") {
            const validation = validateCdnImageConfig(config, { requireCredentials: true });
            if (!validation.ok) throw new Error(`invalid CDN image configuration: ${validation.errors.join(", ")}`);
            const identity = manifestIdentity(config);
            const existing = manifest && manifest.provider === identity.provider && manifest.bucket === identity.bucket && manifest.publicBaseUrl === identity.publicBaseUrl
                ? manifest
                : { version: 1, ...identity, entries: {} };
            const syncDiff = diffManifest(existing, assets, identity);
            const provider = createQiniuProvider(config.qiniu);
            const entries = { ...existing.entries };
            for (const asset of [...syncDiff.missing, ...syncDiff.changed]) {
                const uploaded = await provider.upload(asset);
                entries[asset.logicalPath] = {
                    objectKey: uploaded.objectKey,
                    sha256: asset.sha256,
                    size: uploaded.size,
                    source: asset.postSource,
                };
            }
            manifest = { version: 1, ...identity, entries };
            writeManifestAtomically(config.manifestPath, manifest);
            hexo.log.info(`[DoraTiger] CDN image sync complete (${syncDiff.missing.length + syncDiff.changed.length} uploaded)`);
        }
        if (action === "prune") {
            if (!manifest) throw new Error("CDN image manifest is missing");
            const identity = manifestIdentity(config);
            const pruneDiff = diffManifest(manifest, assets, identity);
            if (pruneDiff.incompatible.length) throw new Error("CDN image manifest identity is incompatible");
            const orphaned = pruneDiff.orphaned;
            if (!options.apply) {
                hexo.log.info(`[DoraTiger] CDN image prune dry-run (${orphaned.length} orphaned)`);
                orphaned.forEach((entry) => hexo.log.info(entry.objectKey));
                if (callback) callback();
                return;
            }
            if (!options.yes) throw new Error("CDN image prune requires --apply --yes");
            const validation = validateCdnImageConfig(config, { requireCredentials: true });
            if (!validation.ok) throw new Error(`invalid CDN image configuration: ${validation.errors.join(", ")}`);
            const provider = createQiniuProvider(config.qiniu);
            for (const entry of orphaned) await provider.remove(entry.objectKey);
            const entries = { ...manifest.entries };
            orphaned.forEach((entry) => delete entries[entry.logicalPath]);
            manifest = { ...manifest, entries };
            writeManifestAtomically(config.manifestPath, manifest);
            hexo.log.info(`[DoraTiger] CDN image prune complete (${orphaned.length} deleted)`);
        }
        if (!manifest) throw new Error("CDN image manifest is missing");
        const diff = diffManifest(manifest, assets, manifestIdentity(config));
        const problemCount = diff.missing.length + diff.changed.length + diff.orphaned.length + diff.incompatible.length;
        if (problemCount) {
            throw new Error(`CDN image manifest is out of date (${problemCount} entries)`);
        }
        hexo.log.info("[DoraTiger] CDN image manifest is current");
        if (callback) callback();
    } catch (error) {
        if (callback) {
            callback(error);
            return;
        }
        throw error;
    }
}

module.exports = runCdnCommand;
module.exports.getAction = getAction;
module.exports.manifestIdentity = manifestIdentity;

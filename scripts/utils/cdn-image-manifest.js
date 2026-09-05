"use strict";

const fs = require("fs");
const path = require("path");

const MANIFEST_VERSION = 1;

function readManifest(manifestPath) {
    if (!fs.existsSync(manifestPath)) return null;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!manifest || manifest.version !== MANIFEST_VERSION || typeof manifest.entries !== "object") {
        throw new Error(`unsupported CDN image manifest: ${manifestPath}`);
    }
    return manifest;
}

function writeManifestAtomically(manifestPath, manifest) {
    const directory = path.dirname(manifestPath);
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    const temporaryPath = `${manifestPath}.tmp`;
    const descriptor = fs.openSync(temporaryPath, "w", 0o600);
    try {
        fs.writeFileSync(descriptor, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
        fs.fsyncSync(descriptor);
    } finally {
        fs.closeSync(descriptor);
    }
    fs.renameSync(temporaryPath, manifestPath);
}

function sameIdentity(manifest, identity) {
    return manifest && ["provider", "bucket", "publicBaseUrl"].every(
        (key) => manifest[key] === identity[key]
    );
}

function diffManifest(manifest, assets, identity) {
    if (!sameIdentity(manifest, identity)) {
        return {
            missing: assets,
            changed: [],
            current: [],
            orphaned: [],
            incompatible: manifest ? [manifest] : [],
        };
    }

    const entries = manifest.entries || {};
    const seen = new Set();
    const result = { missing: [], changed: [], current: [], orphaned: [], incompatible: [] };
    for (const asset of assets) {
        seen.add(asset.logicalPath);
        const entry = entries[asset.logicalPath];
        if (!entry) {
            result.missing.push(asset);
        } else if (entry.sha256 !== asset.sha256 || entry.objectKey !== asset.objectKey) {
            result.changed.push(asset);
        } else {
            result.current.push(asset);
        }
    }
    for (const [logicalPath, entry] of Object.entries(entries)) {
        if (!seen.has(logicalPath)) {
            result.orphaned.push({ logicalPath, ...entry });
        }
    }
    return result;
}

module.exports = {
    MANIFEST_VERSION,
    diffManifest,
    readManifest,
    sameIdentity,
    writeManifestAtomically,
};

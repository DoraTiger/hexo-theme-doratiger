"use strict";

const path = require("path");

function splitSuffix(value) {
    const match = String(value || "").match(/^([^?#]*)(.*)$/);
    return { pathname: match ? match[1] : "", suffix: match ? match[2] : "" };
}

function localLogicalPath(value, pagePath = "") {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(String(value || ""))) return "";
    const pathname = decodeURIComponent(splitSuffix(value).pathname);
    const localPath = pathname.replace(/^\/+/, "");
    if (!pathname || pathname.startsWith("/")) return localPath;
    return path.posix.normalize(path.posix.join(pagePath, localPath)).replace(/^\.\/|^\/+/, "");
}

function rewriteSrcset(value, replace) {
    return String(value || "").split(",").map((candidate) => {
        const match = candidate.match(/^(\s*)(\S+)([\s\S]*)$/);
        if (!match) return candidate;
        return `${match[1]}${replace(match[2])}${match[3]}`;
    }).join(",");
}

module.exports = { localLogicalPath, rewriteSrcset, splitSuffix };

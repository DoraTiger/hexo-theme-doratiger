"use strict";

const { isEmptyObject } = require("./object.js");

module.exports = {
    loadResource(resource, type, globalCDN, urlFor = (resourcePath) => resourcePath) {
        if (isEmptyObject(resource)) {
            return "";
        }

        if (type === "script") {
            return resource.script ? `<script>${resource.script}</script>` : "";
        }

        const enableCDN = resource.enable_cdn || globalCDN;
        const paths = enableCDN ? resource.cdn[type] : resource.local[type];

        if (isEmptyObject(paths)) {
            return "";
        }

        return paths
            .map((path) => {
                if (type === "css") {
                    return `<link rel="stylesheet" href="${enableCDN ? path : urlFor(path)}">`;
                } else if (type === "js") {
                    return `<script src="${enableCDN ? path : urlFor(path)}"></script>`;
                }
                return "";
            })
            .join("\n");
    },
};

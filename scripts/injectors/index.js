/* global hexo */

"use strict";

hexo.extend.injector.register("head_begin", () => {}, "default");

hexo.extend.injector.register(
    "head_end",
    function () {
        let inject_content = [];
        inject_content.push(require("./lib/injector-config.js")(hexo));
        inject_content.push(require("./lib/injector-search.js")(hexo));
        inject_content.push(require("./lib/injector-resource.js")(hexo, "css"));
        return inject_content.join("\n");
    },
    "default"
);

hexo.extend.injector.register("body_begin", () => {}, "default");

hexo.extend.injector.register(
    "body_end",
    () => {
        let inject_content = [];
        inject_content.push(require("./lib/injector-resource.js")(hexo, "js"));
        inject_content.push(
            require("./lib/injector-resource.js")(hexo, "script")
        );
        inject_content.push(require("./lib/injector-comments.js")(hexo));
        return inject_content.join("\n");
    },
    "default"
);

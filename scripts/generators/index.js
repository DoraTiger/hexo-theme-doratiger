/* global hexo */

"use strict";

hexo.extend.generator.register("doratiger_404", require("./lib/404"));
hexo.extend.generator.register("doratiger_about", require("./lib/about"));
hexo.extend.generator.register("doratiger_tags", require("./lib/tags"));
hexo.extend.generator.register(
    "doratiger_categories",
    require("./lib/categories")
);

hexo.extend.generator.register("doratiger_redirect", require("./lib/redirect"));
hexo.extend.generator.register("index", require("./lib/index"));
hexo.extend.generator.register("doratiger_robots", require("./lib/robots"));
hexo.extend.generator.register("doratiger_terms", require("./lib/terms"));
hexo.extend.generator.register("doratiger_privacy", require("./lib/privacy"));
hexo.extend.generator.register("doratiger_sitemap", require("./lib/sitemap"));
hexo.extend.generator.register("doratiger_local_search", require("./lib/local-search"));

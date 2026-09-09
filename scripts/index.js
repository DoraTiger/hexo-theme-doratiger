/* global hexo */

"use strict";

// Hexo loads only files directly under `scripts/`; keep feature entry points
// decoupled in their own directories and register them from this root entry.
require("./console")(hexo);
require("./events")(hexo);
require("./filters")(hexo);
require("./generators")(hexo);
require("./helpers")(hexo);

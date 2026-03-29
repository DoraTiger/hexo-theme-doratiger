hexo.extend.console.register(
    "algolia",
    "Algolia Index Manager",
    {
        options: [
            {
                name: "-c, --clean",
                description: "weather to clean the index",
                default: true,
            },
            {
                name: "-d, --dry-run",
                description: "simulate the indexing process",
                default: true,
            },
        ],
    },
    (options, callback) => {
        require("./lib/algolia.js")(hexo, options, callback);
    }
);

hexo.extend.console.register(
    "themeinit",
    "Initialize DoraTiger theme config files",
    {
        options: [
            {
                name: "-f, --force",
                description: "overwrite existing target file",
                default: false,
            },
            {
                name: "-l, --legacy",
                description: "also generate legacy source/_data/doratiger_config.yml",
                default: false,
            },
        ],
    },
    (options, callback) => {
        require("./lib/themeinit.js")(hexo, options, callback);
    }
);

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

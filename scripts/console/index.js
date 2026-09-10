module.exports = (hexo) => {
hexo.extend.console.register('multi-server', 'DoraTiger: preview one isolated target', {
    usage: '<target> [--static] [--port <port>] [--ip <ip>]',
    options: [
        { name: '-p, --port <port>', desc: 'Local port (default 4000)' },
        { name: '-i, --ip <ip>', desc: 'IPv4 bind address (default 127.0.0.1)' },
        { name: '--static', desc: 'Verify and serve the latest artifact without rebuilding it' },
    ],
}, options => require('./lib/multi-server')(hexo, options));
for (const action of ['history', 'clean']) {
    hexo.extend.console.register(`multi-${action}`, `DoraTiger: multi-target ${action}`, {
        usage: '<target> | --all',
        options: [
            { name: '--all', desc: 'Select every configured target' },
            ...(action === 'history' ? [
                { name: '--limit <count>', desc: 'Maximum records to show (default 20)' },
                { name: '--json', desc: 'Print JSON; add --silent to suppress Hexo startup logs' },
            ] : [
                { name: '--dry-run', desc: 'Preview cleanup (the default)' },
                { name: '--apply', desc: 'Delete only the listed managed runtime data' },
                { name: '--yes', desc: 'Confirm deletion; required with --apply' },
            ]),
        ],
    }, options => require('./lib/multi-maintenance')(hexo, action, options));
}
for (const action of ['generate', 'push', 'deploy']) {
    hexo.extend.console.register(`multi-${action}`, `DoraTiger: multi-target ${action}`, {
        usage: '<target> | --all',
        options: [
            { name: '--all', desc: 'Select every configured target' },
            { name: '--dry-run', desc: 'Validate and show plan without side effects' },
            ...(action === 'push' ? [{ name: '--force', desc: 'Allow branch takeover and overwrite concurrent remote changes' }] : []),
        ],
    }, options => require('./lib/multi-deploy')(hexo, action, options));
}
hexo.extend.console.register(
    "algolia",
    "Algolia Index Manager",
    {
        options: [
            { name: '--target <target>', description: 'Use one DoraTiger multi target in an isolated Hexo build' },
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
    (options) => {
        return require("./lib/algolia.js")(hexo, options);
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

hexo.extend.console.register(
    "cdn",
    "DoraTiger CDN image manager",
    {
        options: [
            {
                name: "--apply",
                description: "perform a destructive prune",
                default: false,
            },
            {
                name: "--yes",
                description: "confirm destructive prune",
                default: false,
            },
        ],
    },
    (options, callback) => {
        require("./lib/cdn-image.js")(hexo, options, callback);
    }
);
};

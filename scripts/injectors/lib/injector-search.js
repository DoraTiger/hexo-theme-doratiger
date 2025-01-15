// "use strict";
// module.exports = (hexo) => {
//     const config = hexo.config;
//     const theme = config.theme_config || {};
//     const env = process.env;

//     // 搜索配置
//     const search = theme.search || {};
//     const search_enable = search.enable || false;
//     const search_type = search.type || null;
//     let searchScript = null;

//     if (!search_enable) {
//         return "";
//     }

//     if (search_type == "algolia") {
//         algoliaConfig = JSON.stringify({
//             algolia: {
//                 appId: env.ALGOLIA_APP_ID || search.algolia.app_id || "",
//                 apiKey: env.ALGOLIA_API_KEY || search.api_key || "",
//                 indexName: env.ALGOLIA_INDEX_NAME || search.index_name || "",
//                 hits: search.algolia.hits,
//             },
//         });
//     }
//     if (search_type == "local") {
//         localConfig = JSON.stringify({
//             localSearch: {},
//         });
//     }

//     return searchScript;
// };

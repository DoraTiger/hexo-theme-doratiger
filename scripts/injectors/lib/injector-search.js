"use strict";
module.exports = (hexo) => {
    const config = hexo.config;
    const theme = config.theme_config || {};
    const env = process.env;

    // 搜索配置
    const search = theme.search || {};
    const search_enable = search.enable || false;
    const search_type = search.type || null;
    let searchScript = null;


    if (!search_enable) {
        return "";
    }

    if (search_type == "algolia") {
        searchScript = JSON.stringify({
            algolia: {
                appId: env.ALGOLIA_APP_ID || search.algolia.app_id || "",
                searchKey:
                    env.ALGOLIA_SEARCH_KEY || search.algolia.search_key || "",
                indexName:
                    env.ALGOLIA_INDEX_NAME || search.algolia.index_name || "",
                per_page: search.algolia.hit.per_page || 10,
                empty: search.algolia.hit.empty || "",
                placeholder: search.algolia.hit.placeholder || "",
            },
        });
    }
    if (search_type == "local") {
        searchScript = JSON.stringify({
            localSearch: {},
        });
    }

    return `
    <script>
        window.searchConfig = ${searchScript};
    </script>
`;
};

"use strict";
const { getThemeConfig } = require("../../utils/theme.js");

module.exports = (hexo) => {
    const theme = getThemeConfig(hexo);
    const env = process.env;

    // 搜索配置
    const search = theme.search || {};
    const search_enable = search.enable || false;
    const search_type = search.type || null;
    let searchScript = null;

    if (!search_enable || search_type !== "algolia") {
        return "";
    }

    if (search_type == "algolia") {
        const algolia = search.algolia || {};
        const hit = algolia.hit || {};
        const language = hexo.theme.i18n.languages[0] || "en";
        const translations = hexo.theme.i18n.data[language] || {};
        const translate = (key) => translations[key] || "";
        searchScript = JSON.stringify({
            algolia: {
                appId: env.ALGOLIA_APP_ID || algolia.app_id || "",
                searchKey:
                    env.ALGOLIA_SEARCH_KEY || algolia.search_key || "",
                indexName:
                    env.ALGOLIA_INDEX_NAME || algolia.index_name || "",
                per_page: hit.per_page || 10,
                empty: hit.empty || translate("search.algolia.empty"),
                placeholder:
                    hit.placeholder || translate("search.algolia.placeholder"),
            },
        });
    }
    return `
    <script>
        window.searchConfig = ${searchScript};
    </script>
`;
};

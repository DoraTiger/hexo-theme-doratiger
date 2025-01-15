const log = require("../../utils/log");

module.exports = (hexo) => {
    const hexoConfig = hexo.config;
    const searchConfig = hexo.theme.config.search;
    // 检查是否启用 algoliasearch 搜索功能
    if (!searchConfig.enable || searchConfig.type !== "algolia") {
        return;
    }

    // 检查是否安装了 algoliasearch
    let algoliasearch = null;
    try {
        algoliasearch = require("algoliasearch");
    } catch (e) {
        log(
            hexo,
            "未安装 algoliasearch，请运行以下命令以启用搜索功能：\n npm install algoliasearch",
            "Algoliasearch is not installed. Run the following command to enable search function:\n npm install algoliasearch",
            "warn"
        );
        algoliasearch = null;
    } finally {
        if (!algoliasearch) {
            return;
        }
    }

    // 检查是否配置了 Algolia
    const algoliaConfig = searchConfig.algolia;
    const env = process.env;
    const app_id = env.ALGOLIA_APP_ID || algoliaConfig.app_id || hexoConfig.algolia.applicationID || "";
    const api_key = env.ALGOLIA_API_KEY || algoliaConfig.api_key  ||"";
    const search_key =
        env.ALGOLIA_SEARCH_KEY || algoliaConfig.search_key || hexoConfig.algolia.apiKey || "";
    const index_name = env.ALGOLIA_INDEX_NAME || algoliaConfig.index_name || hexoConfig.algolia.indexName ||"";

    if (!app_id || !api_key || !search_key || !index_name) {
        log(
            hexo,
            "Algolia 配置不完整，请检查配置文件",
            "Algolia configuration is incomplete, please check the configuration file",
            "warn"
        );
        return;
    }

    var INDEXED_PROPERTIES = [
        "title",
        "date",
        "updated",
        "slug",
        "excerpt",
        "permalink",
        "layout",
        "image",
    ];


    return;
};

const log = require("../../utils/log");
const { getBoolOption } = require("../../utils/args.js");
const { getPostsWithFields } = require("../../utils/posts.js");
/**
 *
 * @param {hexo} hexo -  hexo 实例
 * @returns {Array} - Algolia 配置
 * @description - 检查 Algolia 配置
 */
function preCheck(hexo) {
    const doratigerConfig = hexo.doratiger.config;
    const searchConfig = doratigerConfig.search;
    const env = process.env;

    // 检查是否启用 algoliasearch 搜索功能
    if (
        !searchConfig ||
        !searchConfig.enable ||
        searchConfig.type !== "algolia"
    ) {
        log(
            hexo,
            "配置文件中未启用 algoliasearch 搜索功能",
            "Algoliasearch search function is not enabled in the configuration file",
            "warn"
        );
        return;
    }

    // 检查是否安装 algoliasearch
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

    // 检查 Algolia 配置
    // 依次从环境变量、主题配置和 Hexo 配置中获取，默认为空
    const algoliaConfig = searchConfig.algolia;
    const app_id =
        env.ALGOLIA_APP_ID ||
        algoliaConfig.app_id ||
        hexoConfig.algolia.applicationID ||
        "";
    const api_key =
        env.ALGOLIA_API_KEY ||
        algoliaConfig.api_key ||
        hexoConfig.algolia.apiKey ||
        "";
    const search_key =
        env.ALGOLIA_SEARCH_KEY ||
        algoliaConfig.search_key ||
        hexoConfig.algolia.apiKey ||
        "";
    const index_name =
        env.ALGOLIA_INDEX_NAME ||
        algoliaConfig.index_name ||
        hexoConfig.algolia.indexName ||
        "";
    const fields = algoliaConfig.fields || [];
    const chunk_size = algoliaConfig.chunk_size || 1000;
    if (!app_id || !api_key || !search_key || !index_name) {
        log(
            hexo,
            "Algolia 配置不完整，请检查配置文件",
            "Algolia configuration is incomplete, please check the configuration file",
            "warn"
        );
        return;
    }

    if (api_key === search_key) {
        log(
            hexo,
            "Algolia API Key 和 Search Key 不应相同",
            "Algolia API Key and Search Key should not be the same",
            "warn"
        );
    }

    return {
        app_id: app_id,
        api_key: api_key,
        index_name: index_name,
        fields: fields,
        chunk_size: chunk_size,
    };
}

module.exports = async (hexo, options, callback) => {
    let option_clean = getBoolOption(options, ["clean", "c"], true);
    let option_dry_run = getBoolOption(options, ["dry-run", "d"], false);
    let algoliaConfig = preCheck(hexo);
    if (!algoliaConfig) {
        return callback();
    }
    await hexo.database.load();
    let posts = getPostsWithFields(hexo, algoliaConfig.fields);

    if (option_dry_run) {
        log(
            hexo,
            "本地运行模式，仅输出索引内容",
            "dry-run mode, only output index content",
            "info"
        );
        console.log(posts);
        return callback();
    }

    const { algoliasearch } = require("algoliasearch");
    const algoliaClient = algoliasearch(
        algoliaConfig.app_id,
        algoliaConfig.api_key
    );

    if (option_clean) {
        log(hexo, "清空索引", "cleaning index", "info");
        try {
            await algoliaClient.clearObjects({
                indexName: algoliaConfig.index_name,
            });
        } catch (error) {
            log(hexo, "索引清空失败", "index clean failed", "error");
            return callback(error);
        }
    }
    log(hexo, "更新索引", "updating index", "info");

    try {
        let requests = posts.map((post) => {
            return {
                action: "addObject",
                body: post,
            };
        });
        await algoliaClient.batch({
            indexName: algoliaConfig.index_name,
            batchWriteParams: {
                requests: requests,
            },
        });
    } catch (error) {
        log(hexo, "更新索引失败", "updating index failed", "error");
        return callback(error);
    }
    log(
        hexo,
        `更新 ${posts.length} 条索引成功`,
        `updating ${posts.length} index success`,
        "info"
    );
};

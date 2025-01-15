"use strict";
module.exports = (hexo) => {
    const config = hexo.config;
    const theme = config.theme_config || {};

    // 评论配置
    const comment = theme.comment || {};
    const comment_enable = comment.enable || false;
    const comment_type = comment.type || null;
    let commentConfig = null;
    if (comment_enable && comment_type && comment[comment_type]) {
        commentConfig = comment[comment_type];
    } else {
        return "";
    }

    let commentScript = "";

    if (comment_type === "gitment") {
        const owner = commentConfig.owner || "";
        const repo = commentConfig.repo || "";
        const client_id = commentConfig.client_id || {};
        const client_secret = commentConfig.client_secret || {};
        const gitmentConfig = JSON.stringify({
            owner: owner,
            repo: repo,
            oauth: {
                client_id: client_id,
                client_secret: client_secret,
            },
        });
        commentScript = `
        <script>
            var gitment = new Gitment(${gitmentConfig});
            gitment.render('comment-container');
        </script>
        `;
    }

    if (comment_type === "valine") {
        const appId = commentConfig.appId || "";
        const appKey = commentConfig.appKey || "";
        const placeholder = commentConfig.placeholder || "";
        const valineConfig = JSON.stringify({
            el: "#comment-container",
            appId: appId,
            appKey: appKey,
            placeholder: placeholder,
        });
        commentScript = `
        <script>
            new Valine(${valineConfig});
        </script>
        `;
    }

    if (comment_type === "twikoo") {
        const envId = commentConfig.envId || {};
        const twikooConfig = JSON.stringify({
            envId: envId,
            el: "#comment-container",
        });
        commentScript = `
        <script>
            twikoo.init(${twikooConfig});
        </script>
        `;
    }

    return commentScript;
};

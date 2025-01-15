"use strict";
const { isEmptyObject } = require("../../utils/object.js");
module.exports = (hexo, data) => {
    if (!data.content) {
        return;
    }
    const enableHighlight = hexo.theme.config.post.highlight.enable;
    const enableCodeLineNumbers = hexo.theme.config.post.highlight.line_number;
    const enableCopyCode = hexo.theme.config.post.highlight.copy;

    if (!enableHighlight) {
        return;
    }

    const languages = hexo.theme.i18n.languages[0] || "en";

    const reg = /<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g;
    data.content = data.content.replace(
        reg,
        (match, codeAttrs, codeContent) => {
            const codeTypeMatch = codeAttrs.match(/class="language-(.*?)"/);
            const codeType = codeTypeMatch ? codeTypeMatch[1] : "code";
            const copyText = hexo.theme.i18n.data[languages]["copy.menu"];
            const copySuccessText =
                hexo.theme.i18n.data[languages]["copy.success"];
            const copyErrorText = hexo.theme.i18n.data[languages]["copy.error"];

            const codeTypeSpan = `<span class="code-header-type">${codeType}</span>`;
            const codeTipsSpan = `<span class="code-header-copy-tips" data0copy="${copyText}"  data-copy-success="${copySuccessText}" data-copy-error="${copyErrorText}"></span>`;
            const copyButtonSpan = `<span class="code-header-copy-button" ><i class="fa fa-clipboard" aria-hidden="true"></i></span>`;
            const copyDiv = enableCopyCode
                ? `<div class="code-header-copy">${codeTipsSpan}${copyButtonSpan}</div>`
                : "";
            const codeHeader = `<div class="code-header">${codeTypeSpan}${copyDiv}</div>`;

            // 创建行号 div
            const codeContentWithoutTrailingNewline = codeContent.replace(
                /\n$/,
                ""
            ); // 去除结尾的换行符
            const lines = codeContentWithoutTrailingNewline.split("\n").length; // 计算行数
            let lineNumbers = "";
            for (let i = 1; i <= lines; i++) {
                lineNumbers += `<div class="line-numbers-item">${i}</div>`;
            }
            const lineNumbersDiv = enableCodeLineNumbers
                ? `<div class="line-numbers">${lineNumbers}</div>`
                : "";

            return `<pre>${codeHeader}<div class="code-content">${lineNumbersDiv}<code${codeAttrs}>${codeContentWithoutTrailingNewline}</code></div></pre>`;
        }
    );
    return data;
};

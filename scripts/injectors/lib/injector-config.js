"use strict";
module.exports = (hexo) => {
    const config = hexo.config;

    // MathJax 配置
    const mathJaxConfig = {
        tex: {
            inlineMath: [
                ["$", "$"],
                ["\\(", "\\)"],
            ],
            displayMath: [
                ["$$", "$$"],
                ["\\[", "\\]"],
            ],
        },
        options: {
            skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
        },
    };

    return `
    <script>
        window.MathJax = ${JSON.stringify(mathJaxConfig)};
    </script>
`;
};

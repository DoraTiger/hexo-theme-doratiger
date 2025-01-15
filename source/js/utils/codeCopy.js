const initCodeCopy= ()=> {
    const codeBlocks = document.querySelectorAll("pre");

    codeBlocks.forEach((codeblock) => {
        const copyButton = codeblock.querySelector(".code-header-copy");
        const copyTips = copyButton.querySelector(".code-header-copy-tips");
        const successTip = copyTips.getAttribute("data-copy-success");
        const errorTip = copyTips.getAttribute("data-copy-error");

        const codeContent = codeblock.querySelector("code");

        copyButton.addEventListener("click", () => {
            navigator.clipboard
                .writeText(codeContent.textContent)
                .then(() => {
                    copyTips.textContent = successTip;
                    copyTips.classList.add('active');
                })
                .catch(() => {
                    copyTips.textContent = errorTip;
                    copyTips.classList.add('active');
                })
                .finally(() => {
                    setTimeout(() => {
                        copyTips.classList.remove('active');
                        copyTips.textContent = "";
                    }, 1000);
                });
        });
    });
};

export {initCodeCopy}

const initCodeCopy= ()=> {
    const codeBlocks = document.querySelectorAll("pre");

    if (!codeBlocks.length) {
        console.debug("[codeCopy] no code blocks found, skip initCodeCopy");
        return;
    }

    codeBlocks.forEach((codeblock) => {
        const copyButton = codeblock.querySelector(".code-header-copy");
        const copyTips = copyButton?.querySelector(".code-header-copy-tips");
        const codeContent = codeblock.querySelector("code");

        if (!copyButton || !copyTips || !codeContent) {
            console.debug("[codeCopy] skip block: required element missing", {
                hasCopyButton: !!copyButton,
                hasCopyTips: !!copyTips,
                hasCodeContent: !!codeContent,
            });
            return;
        }

        if (!navigator.clipboard) {
            console.debug("[codeCopy] navigator.clipboard unavailable, skip binding");
            return;
        }

        const successTip = copyTips.getAttribute("data-copy-success");
        const errorTip = copyTips.getAttribute("data-copy-error");

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

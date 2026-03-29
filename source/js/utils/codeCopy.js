const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.debug("[codeCopy] clipboard API failed, fallback to execCommand", error);
        }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    let copied = false;
    try {
        copied = document.execCommand("copy");
    } catch (error) {
        console.debug("[codeCopy] execCommand copy failed", error);
    }

    document.body.removeChild(textarea);
    return copied;
};

const showTip = (copyTips, tip) => {
    copyTips.textContent = tip;
    copyTips.classList.add("active");
};

const initCodeCopy = ()=> {
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

        const defaultTip = copyTips.getAttribute("data-copy") || "";
        const successTip = copyTips.getAttribute("data-copy-success") || defaultTip;
        const errorTip = copyTips.getAttribute("data-copy-error") || defaultTip;

        copyButton.addEventListener("click", async () => {
            const copied = await copyText(codeContent.textContent || "");
            showTip(copyTips, copied ? successTip : errorTip);

            setTimeout(() => {
                copyTips.classList.remove("active");
                copyTips.textContent = defaultTip;
            }, 1000);
        });
    });
};

export {initCodeCopy}

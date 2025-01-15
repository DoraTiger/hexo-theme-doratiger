const autoResizeFooterRight = () => {
    const footerWrapper = document.querySelector("#footer-wrapper");
    const footerLeft = document.querySelector("#footer-left");
    const footerCenter = document.querySelector("#footer-center");
    const footerRight = document.querySelector("#footer-right");

    // 配置自适应收缩对象
    const elements = [
        { selector: "#footer-right-statistics", width: 0 },
        { selector: "#footer-right-copyright", width: 0 },
        { selector: "#footer-right-miit", width: 0 },
        { selector: "#footer-right-mps", width: 0 },
    ];

    // 初始化对象及宽度信息
    elements.forEach((element) => {
        const el = footerRight.querySelector(element.selector);
        if (el) {
            el.classList.remove("hidden");
            element.width = el.offsetWidth;
        }
    });

    const footerWidth = footerWrapper.offsetWidth;
    const footerLeftWidth = footerLeft.offsetWidth;
    const footerCenterWidth = footerCenter.offsetWidth;

    // 循环计算剩余宽度，隐藏多余元素
    let footerRightWidth =
        footerWidth - footerLeftWidth - footerCenterWidth - 128;

    for (let i = elements.length - 1; i >= 0; i--) {
        if (footerRightWidth > elements[i].width) {
            footerRightWidth -= elements[i].width + 16;
        } else {
            for (let j = 0; j <= i; j++) {
                const element = footerRight.querySelector(elements[j].selector);
                if (element) element.classList.add("hidden");
            }
            break;
        }
    }
};

const initAutoResizeFooterRight = () => {
    autoResizeFooterRight();
    window.addEventListener("resize", () => {
        autoResizeFooterRight();
    });
};

export { initAutoResizeFooterRight };

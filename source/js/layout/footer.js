const autoResizeFooterRight = () => {
    const footerWrapper = document.querySelector("#footer-wrapper");
    const footerLeft = document.querySelector("#footer-left");
    const footerCenter = document.querySelector("#footer-center");
    const footerRight = document.querySelector("#footer-right");

    if (!footerWrapper || !footerLeft || !footerCenter || !footerRight) {
        console.debug("[footer] skip autoResizeFooterRight: required element missing");
        return;
    }

    // 由低到高的展示优先级。空间不足时先隐藏社区记录和可省略的信息，
    // 法定备案最后保留。
    const elements = [
        ...Array.from(
            footerRight.querySelectorAll(".footer-right-community-records-item"),
        ).map((el) => ({ element: el, width: 0 })),
        { selector: "#footer-right-statistics", width: 0 },
        { selector: "#footer-right-copyright", width: 0 },
        { selector: "#footer-right-miit", width: 0 },
        { selector: "#footer-right-mps", width: 0 },
    ];

    // 初始化对象及宽度信息
    elements.forEach((element) => {
        const el = element.element || footerRight.querySelector(element.selector);
        if (el) {
            el.classList.remove("hidden");
            element.width = el.offsetWidth;
        }
    });

    const footerWidth = footerWrapper.offsetWidth;
    const footerLeftWidth = footerLeft.offsetWidth;
    const footerCenterWidth = footerCenter.offsetWidth;

    const availableWidth =
        footerWidth - footerLeftWidth - footerCenterWidth - 128;
    let occupiedWidth = elements.reduce((total, element) => {
        return total + (element.width ? element.width + 16 : 0);
    }, 0);

    // 依次移除低优先级元素，避免“最后一个元素放不下就全部隐藏”的
    // 连带效应，也让新增项只需声明自身优先级。
    for (const element of elements) {
        if (occupiedWidth <= availableWidth) break;

        const el = element.element || footerRight.querySelector(element.selector);
        if (!el || !element.width) continue;

        el.classList.add("hidden");
        occupiedWidth -= element.width + 16;
    }
};

const initAutoResizeFooterRight = () => {
    autoResizeFooterRight();
    window.addEventListener("resize", () => {
        autoResizeFooterRight();
    });
};

export { initAutoResizeFooterRight };

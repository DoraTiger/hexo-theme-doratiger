import { createModalDialog } from "../utils/dialog.js";

/**
 * @description 初始化实时时间显示
 * @param {string} selector - 显示时间的元素选择器
 */
const initClock = (selector = ".header-right-time-time") => {
    const timeElement = document.querySelector(selector);

    if (!timeElement) {
        console.warn(`Element with selector "${selector}" not found.`);
        return;
    }

    // 更新时间
    const updateTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        timeElement.textContent = `${hours}:${minutes}:${seconds}`;
    };

    // 每秒更新一次时间
    updateTime();
    setInterval(updateTime, 1000);
};

const initToggleHeaderMenu = (
    menu_selector = "#header-left-menu-list",
    button_selector = "#header-left-menu-icon"
) => {
    const menuList = document.querySelector(menu_selector);
    const toggleButton = document.querySelector(button_selector);
    const closeButton = document.querySelector("#header-left-menu-close");

    if (!menuList || !toggleButton) {
        console.debug("[header] skip initToggleHeaderMenu: required element missing", {
            menu_selector,
            button_selector,
        });
        return;
    }

    const narrowViewport = window.matchMedia("(max-width: 1279px)");
    let desktopVisible = true;

    const closeMobileMenu = (restoreFocus = true) => {
        menuList.classList.remove("show");
        menuList.setAttribute("aria-hidden", "true");
        menuList.setAttribute("role", "dialog");
        menuList.setAttribute("aria-modal", "true");
        menuList.setAttribute("tabindex", "-1");
        toggleButton.setAttribute("aria-expanded", "false");
        document.body.classList.remove("modal-open");
        if (restoreFocus) toggleButton.focus();
    };

    const openMobileMenu = () => {
        menuList.classList.add("show");
        menuList.setAttribute("aria-hidden", "false");
        toggleButton.setAttribute("aria-expanded", "true");
        document.body.classList.add("modal-open");
        menuList.querySelector(".header-left-menu-list-item")?.focus();
    };

    const renderMenu = () => {
        if (narrowViewport.matches) {
            closeMobileMenu(false);
            return;
        }

        menuList.classList.remove("show");
        menuList.classList.toggle("desktop-hidden", !desktopVisible);
        menuList.removeAttribute("role");
        menuList.removeAttribute("aria-modal");
        menuList.removeAttribute("tabindex");
        menuList.setAttribute("aria-hidden", "false");
        toggleButton.setAttribute("aria-expanded", String(desktopVisible));
        document.body.classList.remove("modal-open");
    };

    toggleButton.addEventListener("click", () => {
        if (narrowViewport.matches) {
            if (menuList.classList.contains("show")) closeMobileMenu();
            else openMobileMenu();
            return;
        }

        desktopVisible = !desktopVisible;
        renderMenu();
    });

    closeButton?.addEventListener("click", () => closeMobileMenu());
    menuList.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            if (narrowViewport.matches) closeMobileMenu(false);
        });
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && narrowViewport.matches && menuList.classList.contains("show")) {
            event.preventDefault();
            closeMobileMenu();
        }
    });
    narrowViewport.addEventListener("change", renderMenu);
    renderMenu();
};

const autoResizeHeaderRight = () => {
    const headerWrapper = document.querySelector("#header-wrapper");
    const headerLeft = document.querySelector("#header-left");
    const headerCenter = document.querySelector("#header-center");
    const headerRight = document.querySelector("#header-right");

    if (!headerWrapper || !headerLeft || !headerCenter || !headerRight) {
        console.debug("[header] skip autoResizeHeaderRight: required element missing");
        return;
    }

    // 配置自适应收缩对象
    const elements = [
        { selector: "#header-right-time", width: 0 },
        { selector: "#header-right-title", width: 0 },
    ];

    // 初始化对象及宽度信息
    elements.forEach((element) => {
        const el = headerRight.querySelector(element.selector);
        if (el) {
            el.classList.remove("hidden");
            element.width = el.offsetWidth;
        }
    });

    const headerWidth = headerWrapper.offsetWidth;
    const headerLeftWidth = headerLeft.offsetWidth;
    const headerCenterWidth = headerCenter.offsetWidth;

    // 循环计算剩余宽度，隐藏多余元素
    let footerRightWidth =
        headerWidth - headerLeftWidth - headerCenterWidth - 128;

    for (let i = elements.length - 1; i >= 0; i--) {
        if (footerRightWidth > elements[i].width) {
            footerRightWidth -= elements[i].width + 16;
        } else {
            for (let j = 0; j <= i; j++) {
                const element = headerRight.querySelector(elements[j].selector);
                if (element) element.classList.add("hidden");
                // console.log(element);
            }
            break;
        }
    }
};

const initAutoResizeHeaderRight = () => {
    autoResizeHeaderRight();
    window.addEventListener("resize", () => {
        autoResizeHeaderRight();
    });
};

const initSearchButton = () => {
    const searchButton = document.querySelector("#header-right-search");
    const searchContainer = document.querySelector("#search-container");

    if (searchButton && searchContainer) {
        const searchMask = searchContainer.querySelector(".search-mask");
        const searchCloseButton = searchContainer.querySelector(
            ".search-content-header-closebutton"
        );
        createModalDialog({
            dialog: searchContainer,
            trigger: searchButton,
            initialFocus: () => searchContainer.querySelector("input"),
            closeButtons: [searchMask, searchCloseButton],
        });
    } else {
        console.debug("[header] skip initSearchButton: required element missing");
    }
};

export { initClock, initAutoResizeHeaderRight, initToggleHeaderMenu, initSearchButton };

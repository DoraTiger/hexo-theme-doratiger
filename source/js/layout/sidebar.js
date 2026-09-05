const initToggleSidebar = (
    sidebar_selector = "#sidebar-container",
    button_selector = "#footer-left-sidebar-icon"
) => {
    const sidebarContainer = document.querySelector(sidebar_selector);
    const toggleButton = document.querySelector(button_selector);

    if (!sidebarContainer || !toggleButton) {
        console.debug("[sidebar] skip initToggleSidebar: required element missing", {
            sidebar_selector,
            button_selector,
        });
        return;
    }

    let isSidebarVisible = window.matchMedia("(min-width: 1280px)").matches;

    function renderSidebar() {
        sidebarContainer.classList.toggle("closed", !isSidebarVisible);
        sidebarContainer.classList.toggle("open", isSidebarVisible);
        toggleButton.classList.toggle("closed", !isSidebarVisible);
        toggleButton.setAttribute("aria-expanded", String(isSidebarVisible));
    }

    function toggleSidebar() {
        isSidebarVisible = !isSidebarVisible; // 切换状态
        renderSidebar();
        if (isSidebarVisible && window.innerWidth < 1280) {
            sidebarContainer.querySelector("a, button")?.focus();
        }
    }

    toggleButton.addEventListener("click", toggleSidebar);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && window.innerWidth < 1280 && isSidebarVisible) {
            isSidebarVisible = false;
            renderSidebar();
            toggleButton.focus();
        }
    });

    window.addEventListener("resize", () => {
        isSidebarVisible = window.matchMedia("(min-width: 1280px)").matches;
        renderSidebar();
    });

    renderSidebar();
};

const initSidebarSwitch = () => {
    const sidebarInfo = document.querySelector("#sidebar-info");
    const sidebarToc = document.querySelector("#sidebar-toc");

    const switchButton = document.querySelector("#sidebar-menu-switch");

    if (!sidebarInfo || !sidebarToc || !switchButton) {
        console.debug("[sidebar] skip initSidebarSwitch: required element missing");
        return;
    }

    const label = switchButton.querySelector("span");
    let isTocVisible = !sidebarToc.classList.contains("hide");

    function renderSidebarSwitch() {
        sidebarToc.classList.toggle("hide", !isTocVisible);
        sidebarInfo.classList.toggle("hide", isTocVisible);
        switchButton.setAttribute("aria-pressed", String(isTocVisible));
        label.textContent = isTocVisible
            ? switchButton.dataset.tocLabel
            : switchButton.dataset.infoLabel;
    }

    function toggleSidebarSwitch() {
        isTocVisible = !isTocVisible;
        renderSidebarSwitch();
    }

    switchButton.addEventListener("click", toggleSidebarSwitch);
    renderSidebarSwitch();
}


export { initToggleSidebar,initSidebarSwitch };

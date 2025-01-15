const initToggleSidebar = (
    sidebar_selector = "#sidebar-container",
    button_selector = "#footer-left-sidebar-icon"
) => {
    const sidebarContainer = document.querySelector(sidebar_selector);
    const toggleButton = document.querySelector(button_selector);

    let isSidebarVisible = true;

    function toggleSidebar() {
        isSidebarVisible = !isSidebarVisible; // 切换状态
        if (isSidebarVisible) {
            sidebarContainer.classList.remove("closed");
            toggleButton.classList.remove("closed");
        } else {
            sidebarContainer.classList.add("closed");
            toggleButton.classList.add("closed");
        }
    }

    toggleButton.addEventListener("click", toggleSidebar);

    window.addEventListener("resize", () => {
        if (window.innerWidth > 1199 && isSidebarVisible) {
            sidebarContainer.classList.remove("closed");
            isSidebarVisible = true;
        } else if (window.innerWidth <= 1199 && !isSidebarVisible) {
            sidebarContainer.classList.add("closed");
            toggleButton.classList.add("closed");
            isSidebarVisible = false;
        }
    });
};

const initSidebarSwitch = () => {
    const sidebarInfo = document.querySelector("#sidebar-info");
    const sidebarToc = document.querySelector("#sidebar-toc");

    const switchButton = document.querySelector(".sidebar-menu-item");

    function toggleSidebarSwitch() {
        if (sidebarInfo.classList.contains("hide")) {
            sidebarToc.classList.add("hide");
            sidebarInfo.classList.remove("hide");

        } else {
            sidebarInfo.classList.add("hide");
            sidebarToc.classList.remove("hide");
        }
    }

    switchButton?.addEventListener("click", toggleSidebarSwitch);
}


export { initToggleSidebar,initSidebarSwitch };

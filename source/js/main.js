import { initPageVisibility } from "./utils/PageVisibility.js";
import { initClock, initAutoResizeHeaderRight,initToggleHeaderMenu,initSearchButton } from "./layout/header.js";
import { initToggleSidebar ,initSidebarSwitch} from "./layout/sidebar.js";
import { initAutoResizeFooterRight } from "./layout/footer.js";
import {initCodeCopy} from "./utils/codeCopy.js";
import ScrollHandler from "./utils/scroll.js";
import Background from  "./layout/backgroud.js";

document.addEventListener("DOMContentLoaded", () => {
    initPageVisibility();
    initClock();
    initToggleSidebar();
    initAutoResizeHeaderRight();
    initAutoResizeFooterRight();
    initToggleHeaderMenu();
    initSidebarSwitch();
    initCodeCopy();
    initSearchButton();
    new ScrollHandler();
    new Background();

});

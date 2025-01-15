class ScrollHandler {
    constructor() {
        this.contentWrapper = document.querySelector("#content-wrapper");
        this.progressNum = document.querySelector(".sidebar-toc-progress-num");
        this.progressBar = document.querySelector(".sidebar-toc-progress-bar");
        this.toc = document.querySelector(".sidebar-toc-content");
        this.returnTop = document.querySelector("#return-top");

        // 确保 DOM 已经加载完成
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.init());
        } else {
            this.init();
        }
    }
    /**
     * @description 初始化滚动功能
     */
    init() {
        this.initReturnTopButton()
        this.updateReturnTopButton();
        this.updateReadProgress();
        this.updateActiveTocLink();
        this.initScroll();
    }

    /**
     * @description 初始化滚动条和阅读进度
     */
    initScroll() {
        // 监听内容区域的滚动事件
        this.contentWrapper.addEventListener("scroll", () => {
            this.updateReturnTopButton();
            this.updateReadProgress();
            this.updateActiveTocLink();
        });
    }

    initReturnTopButton() {
        this.returnTop.addEventListener("click", () => {
            this.contentWrapper.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        });
    }

    updateReturnTopButton() {
        const scrollTop = this.contentWrapper.scrollTop; // 滚动高度
        if (scrollTop > 600) {
            this.returnTop.classList.add("show");
        }else {
            this.returnTop.classList.remove("show");
        }
    }

    /**
     * @description 更新阅读进度
     */
    updateReadProgress() {
        const scrollTop = this.contentWrapper.scrollTop; // 滚动高度
        const scrollHeight = this.contentWrapper.scrollHeight; // 内容高度
        const clientHeight = this.contentWrapper.clientHeight; // 可视区域高度

        // 计算阅读进度百分比
        const scrollableHeight = scrollHeight - clientHeight;
        const scrollPercentage =
            scrollableHeight === 0
                ? 100
                : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

        // 更新进度显示
        if (this.progressNum)
            this.progressNum.textContent = `${scrollPercentage}`;
        if (this.progressBar)
            this.progressBar.style.width = `${scrollPercentage}%`;
    }

    /**
     * @description 更新激活的 TOC 链接
     */
    updateActiveTocLink() {
        const scrollTop = this.contentWrapper.scrollTop; // 滚动高度
        const scrollHeight = this.contentWrapper.scrollHeight; // 内容高度
        const clientHeight = this.contentWrapper.clientHeight; // 可视区域高度
        const headerHeight =
            document.querySelector("#header-wrapper").offsetHeight; // 顶部导航栏高度
        const footerHeight =
            document.querySelector("#footer-wrapper").offsetHeight; // 底部导航栏高度
        const headings = Array.from(
            this.contentWrapper.querySelectorAll("h1, h2, h3, h4, h5, h6")
        );

        // 如果没有标题，直接返回
        if (!headings.length) return;

        // 记录每个标题的位置信息
        const headingPositions = headings.map((heading) => {
            return {
                id: heading.id, // 标题的 ID
                offsetTop: heading.offsetTop, // 标题距离顶部的距离
            };
        });

        let currentHeading = null;

        if (scrollTop + clientHeight >= scrollHeight - footerHeight) {
            // 如果滚动到了页面底部，激活最后一个 TOC 链接
            currentHeading = headingPositions[headingPositions.length - 1];
        } else {
            // 找到当前滚动位置对应的标题
            for (let i = 0; i < headingPositions.length; i++) {
                if (scrollTop >= headingPositions[i].offsetTop - headerHeight) {
                    currentHeading = headingPositions[i];
                } else {
                    break;
                }
            }
        }

        if (!currentHeading) {
            // 如果没有找到标题，说明滚动到了页面顶部
            currentHeading = headingPositions[0];
        }

        // 找到当前激活的 TOC 链接
        const activeLink = this.toc?.querySelector(
            `.toc-link[href="#${encodeURIComponent(currentHeading.id)}"]`
        );

        // 如果没有找到激活的 TOC 链接，直接返回
        if (!activeLink) return;

        // 折叠所有 TOC 项
        const tocChildren = this.toc.querySelectorAll(".toc-child");
        tocChildren.forEach((child) => {
            child.style.height = "0"; // 设置高度为 0
            child.classList.remove("expanded"); // 移除展开状态
        });

        // 关闭所有 TOC 链接的激活状态
        const tocLinks = this.toc.querySelectorAll(".toc-link");
        tocLinks.forEach((link) => {
            link.classList.remove("active");
        });

        // 展开当前激活的 TOC 项

        activeLink.classList.add("active");
        let parent = activeLink.closest(".toc-child");

        while (parent) {
            parent.style.height = parent.scrollHeight + "px"; // 设置实际高度
            parent.classList.add("expanded"); // 添加展开状态
            parent = parent.parentElement.closest(".toc-child");
        }
    }
}

// 导出 ScrollHandler 类
export default ScrollHandler;

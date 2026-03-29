// 本地搜索（ES6 模块）

const initLocalSearch = () => {
    const cfg = (window.searchConfig || {}).localSearch;
    if (!cfg) return;

    const container = document.getElementById("search-container");
    const hitsEl = document.getElementById("algolia-hits");
    if (!container || !hitsEl) return;

    const input = container.querySelector(".search-content-box-input");
    if (!input) return;

    let index = null;
    const perPage = parseInt(cfg.per_page) || 10;
    const emptyText = cfg.empty || "找不到内容";
    const indexPath = cfg.indexPath || "/search.json";

    // 加载索引
    fetch(indexPath)
        .then((r) => r.json())
        .then((data) => { index = data; });

    // 搜索
    let debounce = null;
    input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            const query = input.value.trim().toLowerCase();
            if (!query) { hitsEl.innerHTML = ""; return; }
            if (!index) return;

            const results = index.filter((item) => {
                const text = (item.title + " " + (item.excerpt || "") + " " + (item.tags || []).join(" ")).toLowerCase();
                return text.indexOf(query) !== -1;
            }).slice(0, perPage);

            if (results.length === 0) {
                hitsEl.innerHTML = `<div class="algolia-hit-empty">${emptyText}</div>`;
                return;
            }

            const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            hitsEl.innerHTML = results.map((item) => {
                const title = item.title.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>");
                return `<div class="algolia-hit-item"><a href="${item.url}" class="algolia-hit-item-link">${title}</a></div>`;
            }).join("");
        }, 200);
    });
};

export { initLocalSearch };

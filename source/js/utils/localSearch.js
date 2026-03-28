// 本地搜索
(function () {
    var cfg = (window.searchConfig || {}).localSearch;
    if (!cfg) return;

    var container = document.getElementById("search-container");
    var hitsEl = document.getElementById("algolia-hits");
    if (!container || !hitsEl) return;

    var input = container.querySelector(".search-content-box-input");
    if (!input) return;

    var index = null;
    var perPage = parseInt(cfg.per_page) || 10;
    var emptyText = cfg.empty || "找不到内容";
    var indexPath = cfg.indexPath || "/search.json";

    // 加载索引
    fetch(indexPath)
        .then(function (r) { return r.json(); })
        .then(function (data) { index = data; });

    // 搜索
    var debounce = null;
    input.addEventListener("input", function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
            var query = input.value.trim().toLowerCase();
            if (!query) { hitsEl.innerHTML = ""; return; }
            if (!index) return;

            var results = index.filter(function (item) {
                var text = (item.title + " " + (item.excerpt || "") + " " + (item.tags || []).join(" ")).toLowerCase();
                return text.indexOf(query) !== -1;
            }).slice(0, perPage);

            if (results.length === 0) {
                hitsEl.innerHTML = '<div class="algolia-hit-empty">' + emptyText + "</div>";
                return;
            }

            var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            hitsEl.innerHTML = results.map(function (item) {
                var title = item.title.replace(new RegExp("(" + escaped + ")", "gi"), "<mark>$1</mark>");
                return '<div class="algolia-hit-item"><a href="' + item.url + '" class="algolia-hit-item-link">' + title + "</a></div>";
            }).join("");
        }, 200);
    });
})();

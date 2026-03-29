// 本地搜索（ES6 模块）

let localSearchInitialized = false;

const normalizeText = (value) => (typeof value === "string" ? value : "");

const normalizePath = (value) => {
    const path = normalizeText(value).trim();
    return path || "/search.json";
};

const appendHighlightedText = (container, text, query) => {
    const sourceText = normalizeText(text);
    const sourceQuery = normalizeText(query);

    if (!sourceQuery) {
        container.textContent = sourceText;
        return;
    }

    const regex = new RegExp(sourceQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
    let lastIndex = 0;
    let matched = regex.exec(sourceText);

    while (matched) {
        if (matched.index > lastIndex) {
            container.appendChild(
                document.createTextNode(sourceText.slice(lastIndex, matched.index))
            );
        }

        const mark = document.createElement("mark");
        mark.textContent = matched[0];
        container.appendChild(mark);

        lastIndex = matched.index + matched[0].length;
        if (matched[0].length === 0) {
            regex.lastIndex += 1;
        }
        matched = regex.exec(sourceText);
    }

    if (lastIndex < sourceText.length) {
        container.appendChild(document.createTextNode(sourceText.slice(lastIndex)));
    }
};

const renderMessage = (hitsEl, text) => {
    hitsEl.textContent = "";
    const message = document.createElement("div");
    message.className = "algolia-hit-empty";
    message.textContent = text;
    hitsEl.appendChild(message);
};

const normalizeIndex = (data) => {
    if (Array.isArray(data)) {
        return data;
    }
    if (data && Array.isArray(data.items)) {
        return data.items;
    }
    return [];
};

const initLocalSearch = () => {
    if (localSearchInitialized) {
        return;
    }

    const cfg = (window.searchConfig || {}).localSearch;
    if (!cfg) return;

    const container = document.getElementById("search-container");
    const hitsEl = document.getElementById("algolia-hits");
    if (!container || !hitsEl) return;

    const input = container.querySelector(".search-content-box-input");
    if (!input) return;

    localSearchInitialized = true;

    let index = [];
    let loadState = "loading";
    const perPage = parseInt(cfg.per_page, 10) || 10;
    const emptyText = normalizeText(cfg.empty) || "找不到内容";
    const loadingText = "搜索索引加载中...";
    const errorText = "搜索索引加载失败";
    const indexPath = normalizePath(cfg.indexPath);

    // 加载索引
    fetch(indexPath)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`failed to load search index: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            index = normalizeIndex(data);
            loadState = "ready";
        })
        .catch((error) => {
            loadState = "error";
            console.error("[localSearch] failed to load index", { indexPath, error });
        });

    // 搜索
    let debounce = null;
    input.addEventListener("input", () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            const query = normalizeText(input.value).trim().toLowerCase();
            if (!query) {
                hitsEl.textContent = "";
                return;
            }

            if (loadState === "loading") {
                renderMessage(hitsEl, loadingText);
                return;
            }

            if (loadState === "error") {
                renderMessage(hitsEl, errorText);
                return;
            }

            const results = index
                .filter((item) => {
                    const title = normalizeText(item.title);
                    const excerpt = normalizeText(item.excerpt);
                    const content = normalizeText(item.content);
                    const tags = Array.isArray(item.tags)
                        ? item.tags.map((tag) => normalizeText(tag)).join(" ")
                        : normalizeText(item.tags);
                    const categories = Array.isArray(item.categories)
                        ? item.categories.map((category) => normalizeText(category)).join(" ")
                        : normalizeText(item.categories);

                    const text = [title, excerpt, content, tags, categories]
                        .join(" ")
                        .toLowerCase();

                    return text.indexOf(query) !== -1;
                })
                .slice(0, perPage);

            hitsEl.textContent = "";

            if (results.length === 0) {
                renderMessage(hitsEl, emptyText);
                return;
            }

            results.forEach((item) => {
                const title = normalizeText(item.title) || "(无标题)";
                const url = normalizeText(item.url) || "#";

                const resultItem = document.createElement("div");
                resultItem.className = "algolia-hit-item";

                const link = document.createElement("a");
                link.className = "algolia-hit-item-link";
                link.href = url;

                appendHighlightedText(link, title, query);
                resultItem.appendChild(link);
                hitsEl.appendChild(resultItem);
            });
        }, 200);
    });
};

export { initLocalSearch };

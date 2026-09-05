const initExternalRedirect = () => {
    const redirectPath = document.documentElement.dataset.redirectPath;
    if (!redirectPath) return;

    document.addEventListener("click", (event) => {
        const link = event.target.closest("a.external-link[data-redirect]");
        if (!link) return;
        event.preventDefault();
        let target = link.dataset.redirect;
        try {
            target = decodeURIComponent(target);
        } catch (_) {
            // A malformed legacy attribute should fall back to the browser's original link.
            return;
        }
        window.location.assign(`${redirectPath}?url=${encodeURIComponent(target)}`);
    }, { capture: true });
};

// Injected from head_end before page markup and page-specific controllers.
// Capture phase also intercepts links carrying target="_blank".
initExternalRedirect();

export { initExternalRedirect };

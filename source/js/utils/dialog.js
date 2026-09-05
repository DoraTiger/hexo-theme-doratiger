const FOCUSABLE_SELECTOR = [
    "a[href]",
    "area[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

const getFocusable = (container) => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getClientRects().length > 0);

const setBackgroundInteractivity = (dialog, isOpen) => {
    Array.from(document.body.children).forEach((element) => {
        if (element === dialog) return;

        if (isOpen) {
            element.dataset.doratigerInertBeforeDialog = String(element.inert);
            element.inert = isOpen;
            return;
        }

        element.inert = element.dataset.doratigerInertBeforeDialog === "true";
        delete element.dataset.doratigerInertBeforeDialog;
    });
};

const createModalDialog = ({ dialog, trigger, initialFocus, closeButtons = [] }) => {
    if (!dialog || !trigger) return null;

    let opener = null;
    const focusInitial = () => {
        const target = typeof initialFocus === "function" ? initialFocus() : initialFocus;
        (target || getFocusable(dialog)[0] || dialog).focus();
    };
    const close = () => {
        if (!dialog.classList.contains("show")) return;
        dialog.classList.remove("show");
        dialog.setAttribute("aria-hidden", "true");
        trigger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("modal-open");
        setBackgroundInteractivity(dialog, false);

        if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
        else trigger.focus();
        opener = null;
    };
    const open = () => {
        if (dialog.classList.contains("show")) return;
        opener = document.activeElement;
        dialog.classList.add("show");
        dialog.setAttribute("aria-hidden", "false");
        trigger.setAttribute("aria-expanded", "true");
        document.body.classList.add("modal-open");
        setBackgroundInteractivity(dialog, true);
        focusInitial();
    };

    trigger.addEventListener("click", () => {
        if (dialog.classList.contains("show")) close();
        else open();
    });
    closeButtons.filter(Boolean).forEach((button) => button.addEventListener("click", close));
    dialog.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            event.preventDefault();
            close();
            return;
        }
        if (event.key !== "Tab") return;

        const focusable = getFocusable(dialog);
        if (!focusable.length) {
            event.preventDefault();
            dialog.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    return { open, close };
};

export { createModalDialog, setBackgroundInteractivity };

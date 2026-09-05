const STORAGE_KEY = "doratiger-appearance";

const isDayAppearance = (appearance, mediaQuery) => (
    appearance === "day" || (appearance === "system" && mediaQuery.matches)
);

class AppearanceController {
    constructor({ root = document.documentElement } = {}) {
        this.root = root;
        this.button = document.querySelector("#header-right-appearance");
        this.symbol = this.button?.querySelector(".header-right-appearance-symbol");
        this.mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
        this.transitionTimer = null;
        this.init();
    }

    init() {
        if (!this.button || !this.symbol) return;
        this.button.addEventListener("click", () => this.toggle());
        this.mediaQuery.addEventListener("change", () => {
            if (this.root.dataset.appearance === "system") {
                this.render();
                this.emitChange("system");
            }
        });
        this.render();
    }

    isDay() {
        return isDayAppearance(this.root.dataset.appearance, this.mediaQuery);
    }

    render() {
        const isDay = this.isDay();
        this.button.setAttribute("aria-pressed", String(isDay));
        this.button.setAttribute("aria-label", isDay ? this.button.dataset.nightLabel : this.button.dataset.dayLabel);
        this.symbol.textContent = isDay ? "☀️" : "🌙";
    }

    toggle() {
        const nextAppearance = this.isDay() ? "night" : "day";
        this.root.classList.remove("appearance-transitioning");
        void this.root.offsetWidth;
        this.root.classList.add("appearance-transitioning");
        this.root.dataset.appearance = nextAppearance;
        try {
            window.localStorage.setItem(STORAGE_KEY, nextAppearance);
        } catch (_) {
            // Storage is optional: the control must still work in restricted contexts.
        }
        this.render();
        this.emitChange(nextAppearance);
        window.clearTimeout(this.transitionTimer);
        this.transitionTimer = window.setTimeout(() => {
            this.root.classList.remove("appearance-transitioning");
        }, 1200);
    }

    emitChange(appearance) {
        document.dispatchEvent(new CustomEvent("doratiger:appearancechange", {
            detail: { appearance, isDay: this.isDay() },
        }));
    }
}

export default AppearanceController;

// Shared size observation and frame scheduling, not a global component refresh bus.
const targets = new Map();
const subscriptions = new Set();
const pending = new Set();
let observer = null;
let frame = null;

const flush = () => {
    frame = null;
    const batch = [...pending];
    pending.clear();
    for (const subscription of batch) {
        if (!subscription.active) continue;
        try { subscription.update(); }
        catch (error) { setTimeout(() => { throw error; }); }
    }
};
const viewportChanged = () => {
    for (const subscription of subscriptions) if (subscription.viewport) subscription.request();
};

export const observeLayout = (elements, update, { viewport = true } = {}) => {
    const nodes = [...new Set(elements.filter(Boolean))];
    const subscription = {
        active: true, viewport, update,
        request() {
            if (!subscription.active) return;
            pending.add(subscription);
            if (frame === null) frame = requestAnimationFrame(flush);
        },
        disconnect() {
            if (!subscription.active) return;
            subscription.active = false;
            pending.delete(subscription);
            subscriptions.delete(subscription);
            for (const node of nodes) {
                const listeners = targets.get(node);
                listeners.delete(subscription);
                if (!listeners.size) { observer?.unobserve(node); targets.delete(node); }
            }
            if (!subscriptions.size) {
                window.removeEventListener('resize', viewportChanged);
                observer?.disconnect(); observer = null;
                if (frame !== null) cancelAnimationFrame(frame);
                frame = null;
            }
        },
    };
    if (!subscriptions.size) {
        window.addEventListener('resize', viewportChanged);
        if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(entries => {
            for (const entry of entries) for (const listener of targets.get(entry.target) || []) listener.request();
        });
    }
    subscriptions.add(subscription);
    for (const node of nodes) {
        if (!targets.has(node)) {
            targets.set(node, new Set());
            observer?.observe(node, { box: 'border-box' });
        }
        targets.get(node).add(subscription);
    }
    subscription.request();
    return { request: subscription.request, disconnect: subscription.disconnect };
};

// A single lifecycle for decorative canvas animation; static content remains visible.
export const runCanvasAnimation = ({ frame, renderStatic }) => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let request = null;
    const tick = (now) => {
        request = null;
        if (frame(now) !== false) request = requestAnimationFrame(tick);
    };
    const update = () => {
        if (request !== null) cancelAnimationFrame(request);
        request = null;
        if (reduced.matches) renderStatic();
        else if (!document.hidden) request = requestAnimationFrame(tick);
    };
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
};

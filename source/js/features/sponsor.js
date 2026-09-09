export const initSponsor = () => {
    const button = document.getElementById('sponsor-btn');
    const panel = document.getElementById('sponsor-panel');
    if (!button || !panel) return;
    button.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
    });
};

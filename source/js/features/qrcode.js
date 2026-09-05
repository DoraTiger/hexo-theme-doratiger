import QRCode from "../utils/qrcode.js";

const initPostQRCodes = (selector = ".post-item-qrcode-img") => {
    const qrcodeNodes = document.querySelectorAll(selector);

    if (!qrcodeNodes.length) {
        console.debug("[qrcode] no qrcode node found, skip initPostQRCodes", { selector });
        return;
    }

    qrcodeNodes.forEach((el) => {
        const url = el.dataset.url;
        const size = parseInt(el.dataset.size) || 80;
        const alt = el.dataset.alt || "";

        if (!url) {
            console.debug("[qrcode] skip node: missing data-url", el);
            return;
        }

        try {
            el.innerHTML = `<img src="${QRCode.toDataURL(url, { size })}" width="${size}" height="${size}" alt="${alt}" />`;
        } catch (error) {
            console.debug("[qrcode] failed to render qrcode", { url, size, error });
        }
    });
};

export { initPostQRCodes };

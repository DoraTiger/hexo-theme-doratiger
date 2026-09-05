const fallbackSource = (image) => image.dataset.cdnImageFallbackSrc || "";

const restorePictureSources = (image) => {
    const picture = image.closest("picture");
    if (!picture) return;
    picture.querySelectorAll("source[data-cdn-image-fallback-srcset]").forEach((source) => {
        source.srcset = source.dataset.cdnImageFallbackSrcset;
        source.dataset.cdnImageFallbackApplied = "true";
    });
};

document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || image.dataset.cdnImageFallbackApplied === "true") return;

    const fallback = fallbackSource(image);
    const fallbackSrcset = image.dataset.cdnImageFallbackSrcset;
    if (!fallback && !fallbackSrcset) return;

    image.dataset.cdnImageFallbackApplied = "true";
    restorePictureSources(image);
    if (fallbackSrcset) image.srcset = fallbackSrcset;
    if (fallback) image.src = fallback;
}, true);

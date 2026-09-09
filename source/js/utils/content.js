import { initCodeCopy } from './codeCopy.js';

// Both initially rendered and decrypted content use the same enhancements.
export const enhanceContent = (root = document) => {
    initCodeCopy(root);
    if (window.hljs) {
        root.querySelectorAll('pre code:not([data-highlighted])').forEach((code) => {
            try {
                window.hljs.highlightElement(code);
            } catch (error) {
                // A highlighter failure must not prevent the rest of the page initializing.
                console.warn('[content] syntax highlighting failed', error);
            }
        });
    }
};

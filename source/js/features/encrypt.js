import { enhanceContent } from '../utils/content.js';

const hexToBuffer = (hex) => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let index = 0; index < hex.length; index += 2) {
        bytes[index / 2] = parseInt(hex.slice(index, index + 2), 16);
    }
    return bytes;
};

const decryptPost = async ({ password, salt, iv, tag, encryptedData }) => {
    const material = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: hexToBuffer(salt), iterations: 100000, hash: "SHA-256" },
        material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const cipherText = hexToBuffer(encryptedData);
    const authenticationTag = hexToBuffer(tag);
    const combined = new Uint8Array(cipherText.length + authenticationTag.length);
    combined.set(cipherText);
    combined.set(authenticationTag, cipherText.length);
    const plainText = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: hexToBuffer(iv), tagLength: 128 }, key, combined
    );
    return new TextDecoder().decode(plainText);
};

const initEncryptedPosts = (selector = ".hexo-encrypt") => {
    document.querySelectorAll(selector).forEach((container) => {
        const input = container.querySelector(".hexo-encrypt-password");
        const submit = container.querySelector(".hexo-encrypt-submit");
        const data = container.querySelector(".hexo-encrypt-data");
        const error = container.querySelector(".hexo-encrypt-error");
        if (!input || !submit || !data) return;

        const clearError = () => {
            input.removeAttribute("aria-invalid");
            if (error) error.hidden = true;
        };
        const showError = () => {
            input.setAttribute("aria-invalid", "true");
            if (error) {
                error.textContent = container.dataset.wrong || "";
                error.hidden = false;
            }
        };
        const unlock = async () => {
            if (submit.disabled) return;
            clearError();
            submit.disabled = true;
            try {
                container.innerHTML = await decryptPost({
                    password: input.value,
                    salt: container.dataset.salt,
                    iv: container.dataset.iv,
                    tag: container.dataset.tag,
                    encryptedData: data.textContent,
                });
                enhanceContent(container);
            } catch (_) {
                showError();
                submit.disabled = false;
            }
        };

        submit.addEventListener("click", unlock);
        input.addEventListener("input", clearError);
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") unlock();
        });
    });
};

export { initEncryptedPosts };

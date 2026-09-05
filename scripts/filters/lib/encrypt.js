"use strict";

const crypto = require("crypto");

/**
 * 文章加密过滤器
 * 构建时 AES-256-GCM 加密，前端 Web Crypto API 解密
 */

const ITERATIONS = 100000;
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

module.exports = function (hexo, data) {
    const theme = hexo.theme.config || {};
    const language = hexo.theme.i18n.languages[0] || "en";
    const translations = hexo.theme.i18n.data[language] || {};
    const translate = (key) => translations[key] || "";

    // 检查是否启用加密
    if (!theme.encrypt || !theme.encrypt.enable) return data;

    // 获取密码：优先 front-matter，其次按标签匹配
    let password = data.password;

    if (!password && theme.encrypt.tags) {
        const tags = theme.encrypt.tags;
        const postTags = (data.tags || []).map((t) => t.name);
        for (const tagConfig of tags) {
            if (postTags.includes(tagConfig.name)) {
                password = tagConfig.password;
                break;
            }
        }
    }

    if (!password) return data;

    // 确保密码是字符串
    password = String(password);

    // 加密内容
    const content = data.content;
    const encrypted = encryptContent(content, password);

    // 生成 HTML（文章 front-matter 优先，其次主题配置，最后默认值）
    const abstract =
        data.abstract || theme.encrypt.abstract || translate("encrypt.abstract");
    const message =
        data.message || theme.encrypt.message || translate("encrypt.message");
    const wrongPass =
        theme.encrypt.wrong_pass_message ||
        translate("encrypt.wrong_pass_message");
    const submitLabel = translate("encrypt.submit");

    data.content = buildEncryptedHTML(encrypted, abstract, message, wrongPass, submitLabel);
    // 首页摘要也替换为加密提示
    data.excerpt = `<div class="hexo-encrypt-summary">🔒 ${escapeHtml(abstract)}</div>`;
    data.layout = data.layout || "post";

    return data;
};

// AES-256-GCM 加密
function encryptContent(content, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // PBKDF2 派生密钥
    const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256");

    // AES-256-GCM 加密
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(content, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return {
        salt: salt.toString("hex"),
        iv: iv.toString("hex"),
        tag: tag.toString("hex"),
        data: encrypted,
    };
}

// 生成加密后的 HTML
function buildEncryptedHTML(encrypted, abstract, message, wrongPass, submitLabel) {
    return `
<div class="hexo-encrypt" data-salt="${encrypted.salt}" data-iv="${encrypted.iv}" data-tag="${encrypted.tag}" data-wrong="${escapeHtml(wrongPass)}">
  <div class="hexo-encrypt-abstract">${escapeHtml(abstract)}</div>
  <div class="hexo-encrypt-input">
    <input type="password" class="hexo-encrypt-password" placeholder="${escapeHtml(message)}" aria-label="${escapeHtml(message)}" />
    <button class="hexo-encrypt-submit" type="button" aria-label="${escapeHtml(submitLabel)}">🔓</button>
  </div>
  <p class="hexo-encrypt-error" role="alert" hidden></p>
  <div class="hexo-encrypt-data" style="display:none">${encrypted.data}</div>
</div>`;
}

function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

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
    const abstract = data.abstract || theme.encrypt.abstract || "这是一篇加密文章，需要密码才能继续阅读。";
    const message = data.message || theme.encrypt.message || "请输入密码：";
    const wrongPass = theme.encrypt.wrong_pass_message || "密码错误，请重试。";

    data.content = buildEncryptedHTML(encrypted, abstract, message, wrongPass);
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
function buildEncryptedHTML(encrypted, abstract, message, wrongPass) {
    return `
<div class="hexo-encrypt" data-salt="${encrypted.salt}" data-iv="${encrypted.iv}" data-tag="${encrypted.tag}" data-wrong="${wrongPass}">
  <div class="hexo-encrypt-abstract">${escapeHtml(abstract)}</div>
  <div class="hexo-encrypt-input">
    <input type="password" class="hexo-encrypt-password" placeholder="${escapeHtml(message)}" />
    <button class="hexo-encrypt-submit" type="button">🔓</button>
  </div>
  <div class="hexo-encrypt-data" style="display:none">${encrypted.data}</div>
</div>
<script>
(function(){
  var d = document, el = d.currentScript.previousElementSibling;
  var salt = el.dataset.salt, iv = el.dataset.iv, tag = el.dataset.tag, wrong = el.dataset.wrong;
  var encData = el.querySelector('.hexo-encrypt-data').textContent;
  var input = el.querySelector('.hexo-encrypt-password');
  var btn = el.querySelector('.hexo-encrypt-submit');

  function hexToBuf(h){var a=new Uint8Array(h.length/2);for(var i=0;i<h.length;i+=2)a[i/2]=parseInt(h.substr(i,2),16);return a}

  async function decrypt(pwd){
    var keyMat = await crypto.subtle.importKey('raw',new TextEncoder().encode(pwd),{name:'PBKDF2'},false,['deriveBits','deriveKey']);
    var key = await crypto.subtle.deriveKey({name:'PBKDF2',salt:hexToBuf(salt),iterations:100000,hash:'SHA-256'},keyMat,{name:'AES-GCM',length:256},false,['decrypt']);
    var ct = hexToBuf(encData);
    var t = hexToBuf(tag);
    var combined = new Uint8Array(ct.length+t.length);
    combined.set(ct);combined.set(t,ct.length);
    var pt = await crypto.subtle.decrypt({name:'AES-GCM',iv:hexToBuf(iv),tagLength:128},key,combined);
    return new TextDecoder().decode(pt);
  }

  btn.addEventListener('click',async function(){
    try{
      var html = await decrypt(input.value);
      el.innerHTML = html;
    }catch(e){
      alert(wrong);
    }
  });
  input.addEventListener('keydown',function(e){if(e.key==='Enter')btn.click()});
})();
</script>`;
}

function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

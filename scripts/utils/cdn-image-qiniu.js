"use strict";

const crypto = require("crypto");
const fs = require("fs");
const https = require("https");

function base64url(value) {
    return Buffer.from(value).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

function hmac(secret, value) {
    return crypto.createHmac("sha1", secret).update(value).digest("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
        });
        req.on("error", reject);
        req.end(body);
    });
}

function createQiniuProvider(config, transport = { request }) {
    const uploadHost = `up-${config.region}.qiniup.com`;
    const uploadToken = (objectKey) => {
        const policy = base64url(JSON.stringify({ scope: `${config.bucket}:${objectKey}`, deadline: Math.floor(Date.now() / 1000) + 3600, returnBody: '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize)}' }));
        return `${config.accessKey}:${hmac(config.secretKey, policy)}:${policy}`;
    };
    const upload = async (asset) => {
        const content = fs.readFileSync(asset.sourcePath);
        const boundary = `----DoraTiger${crypto.randomBytes(12).toString("hex")}`;
        const fields = [
            ["token", uploadToken(asset.objectKey)],
            ["key", asset.objectKey],
        ];
        const chunks = [];
        for (const [name, value] of fields) chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
        chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${asset.objectKey.split("/").pop()}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
        chunks.push(content, Buffer.from(`\r\n--${boundary}--\r\n`));
        const body = Buffer.concat(chunks);
        const response = await transport.request({ host: uploadHost, method: "POST", path: "/", headers: { "content-type": `multipart/form-data; boundary=${boundary}`, "content-length": body.length } }, body);
        if (response.statusCode < 200 || response.statusCode >= 300) throw new Error(`Qiniu upload failed for ${asset.objectKey} (${response.statusCode})`);
        const data = JSON.parse(response.body || "{}");
        return { objectKey: asset.objectKey, etag: data.hash || "", size: content.length };
    };
    const remove = async (objectKey) => {
        const entry = base64url(`${config.bucket}:${objectKey}`);
        const requestPath = `/delete/${entry}`;
        const signature = hmac(config.secretKey, `${requestPath}\n`);
        const response = await transport.request({
            host: `rs-${config.region}.qiniuapi.com`,
            method: "POST",
            path: requestPath,
            headers: { authorization: `QBox ${config.accessKey}:${signature}` },
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`Qiniu delete failed for ${objectKey} (${response.statusCode})`);
        }
    };
    return { upload, remove };
}

module.exports = { base64url, createQiniuProvider };

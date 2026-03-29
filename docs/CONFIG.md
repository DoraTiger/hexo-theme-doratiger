# Hexo Theme DoraTiger 配置文档

> 所有配置均在 `_config.hexo-theme-doratiger.yml` 中修改，不要直接改主题源码。

---

## 第一部分：主题基本功能

### 全局配置

```yaml
global:
  hello: true                          # 控制台启动提示
  favicon: /images/favicon_default.png # 浏览器标签图标
  avatar: /images/avatar_default.png   # 默认头像
```

| 字段 | 说明 |
|------|------|
| `hello` | 启动时在控制台显示主题 logo |
| `favicon` | 浏览器标签页图标路径 |
| `avatar` | 默认用户头像路径 |

### 侧边栏

```yaml
sidebar:
  info:
    enable: true
    user: ""       # 留空使用 hexo 的 author
    avatar: ""     # 留空使用 global.avatar
    intro: ""      # 留空使用 hexo 的 description
  social:
    enable: true
    item:
      - { text: "Github", url: "https://github.com/DoraTiger" }
  toc:
    enable: true
    number: false   # 目录编号
    depth: 3        # 目录深度
  friendlink:
    enable: true
    item:
      - { text: "站点名", url: "https://example.com" }
```

### 导航栏

```yaml
header:
  menu:
    - { key: "home", url: "/" }
    - { key: "archives", url: "/archives" }
    - { key: "categories", url: "/categories" }
    - { key: "tags", url: "/tags" }
    - { key: "about", url: "/about" }
    # - { key: "terms", url: "/terms" }
    # - { key: "privacy", url: "/privacy" }
  time:
    enable: true    # 右上角显示时间
```

`key` 对应 `languages/*.yml` 中的翻译。内置 key：`home`、`archives`、`categories`、`tags`、`about`、`terms`、`privacy`、`redirect`、`page404`。

### 页脚

```yaml
footer:
  since:
    enable: true
    year: 2018
  beian:
    miit:
      enable: false
      text: "豫 ICP 备 xxxxxx 号 -1"
      link: "https://beian.miit.gov.cn"
    mps:
      enable: false
      text: "豫公网安备 xxxxxxxxxx 号"
      link: "https://www.beian.gov.cn/..."
      icon: "/images/police_beian.png"
```

### 首页

```yaml
home:
  auto_excerpt:
    enable: true
    length: 200       # 摘要字数，建议配合 <!-- more -->
  post_meta:
    date: true
    update: true
    categories: true
    tags: true
    excerpt: true
```

### 文章页

```yaml
post:
  post_meta:
    date: true
    update: true
    categories: true
    tags: true
    excerpt: true
  highlight:
    enable: true
    type: "highlight.js"
    line_number: true
    copy: true
  copyright:
    enable: true
    license: "CC BY-NC-SA 4.0"
    link: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    email: ""
```

#### 代码复制（post.highlight.copy）

```yaml
post:
  highlight:
    copy: true
```

- `copy: true` 时会在代码块右上角显示复制按钮。
- 运行时优先使用 `navigator.clipboard`，在不支持或受限场景自动回退到 `document.execCommand("copy")`。
- 复制提示文案来自主题语言包（复制 / 复制成功 / 复制错误）。

#### 文章二维码（post_extend.qrcode）

```yaml
post_extend:
  qrcode:
    enable: true
    size: 120
    tip: "手机扫码阅读"
```

- `enable`：开启文章版权区二维码。
- `size`：二维码像素尺寸。
- `tip`：二维码下方提示文案。
- `position` 已废弃，不再生效。

#### 赞赏功能（post_extend.sponsor）

```yaml
post_extend:
  sponsor:
    enable: true
    tip: "如果觉得有帮助，可以请作者喝杯咖啡 ☕"
    alipay: "/images/alipay.jpg"
    wechat: "/images/wechat.jpg"
```

- `enable`：是否显示文章底部“赞赏”按钮。
- `tip`：点击赞赏后面板中的提示文案。
- `alipay`：支付宝收款码图片路径。
- `wechat`：微信收款码图片路径。

配置说明：

- 路径请使用站点根路径形式，例如 `/images/alipay.jpg`。
- 图片建议放在博客根目录的 `source/images/` 下（例如 `source/images/alipay.jpg`）。
- 如果 `alipay` 或 `wechat` 为空，对应二维码不会渲染。
- 主题仓库中的默认二维码仅用于演示，请务必替换为你自己的收款码图片。

### 样式

```yaml
style:
  color:
    theme: "rgba(230, 119, 0, 1)"       # 主题色，改这一个全局换色
    sub_theme: "rgba(73, 177, 245, 1)"
    text: "rgba(255, 255, 255, 1)"
  font:
    size: "16px"
  sidebar:
    width: "300px"
  main:
    content:
      max_width: "1200px"
      padding: "1rem"
```

### 资源管理

```yaml
resource:
  enable_cdn: false    # 全局 CDN 开关
```

每个资源可独立覆盖：`enable_cdn` 留空跟随全局，`true` 强制 CDN，`false` 强制本地。

支持的资源：`highlight.js`、`busuanzi`、`twikoo`、`valine`、`algolia`、`font_awesome`、`mathjax`。

### 第三方资源

```yaml
thirdparty:
  font_awesome:
    enable_cdn:
    local: { css: ["/lib/font-awesome/@6.7.2/css/all.min.css"] }
    cdn: { css: ["https://cdnjs.cloudflare.com/..."] }
  mathjax:
    enable_cdn:
    local: { js: ["/lib/mathjax/@3.2.2/tex-mml-chtml.js"] }
    cdn: { js: ["https://www.unpkg.com/..."] }
```

### 多语言

翻译文件在 `languages/` 目录下：`zh-Hans.yml`（简中）、`zh-Hant.yml`（繁中）、`en.yml`（English）。通过 `_config.yml` 的 `language` 字段指定。

---

## 第二部分：主题扩展功能

### 文章置顶

在文章 front-matter 中添加 `sticky` 字段，数字越大越靠前。

```markdown
---
title: 置顶文章
sticky: 100
---
```

置顶文章在首页显示 `📌 置顶` 标记。

### 文章加密

构建时 AES-256-GCM 加密，前端 Web Crypto API 解密。**需要 HTTPS 环境。**

```yaml
encrypt:
  enable: true
  abstract: "这是一篇加密文章，需要密码才能继续阅读。"
  message: "请输入密码："
  wrong_pass_message: "密码错误，请重试。"
```

**使用方式：**

1. 单篇文章 — front-matter 添加 `password`：

```markdown
---
title: 私密文章
password: my-secret-password
abstract: 🔒 这是一篇加密文章    # 可选，覆盖主题默认
message: 请输入密码             # 可选，覆盖主题默认
---
```

2. 按标签批量加密：

```yaml
encrypt:
  tags:
    - name: "private"
      password: "shared-password"
```

**安全性：**
- AES-256-GCM + PBKDF2（100000 次迭代）
- 密码不在 JS 代码中，仅用于解密
- 标题/标签/日期仍是明文
- 首页摘要自动替换为加密提示

### sitemap.xml / sitemap.txt

主题自建生成器，不依赖外部插件。

```yaml
sitemap:
  enable: true
  format: "both"        # xml | txt | both
  changefreq: "weekly"
  priority:
    home: 1.0
    post: 0.8
    page: 0.6
    category: 0.5
    tag: 0.5
    archive: 0.4
```

文章 front-matter 中 `sitemap: false` 可排除该文章。

### robots.txt

主题自动生成。

```yaml
robots:
  enable: true
  disallow:
    - /admin/
    - /api/
    - /tmp/
```

URL 从 `hexo.config.url` 自动取，sitemap 引用自动关联。

### 服务条款 & 隐私政策

主题自动生成，配置驱动。

```yaml
terms:
  enable: true
  title: "服务条款"
  license: ""              # 留空自动使用 post.copyright.license
  extra_content: ""         # 额外条款（支持 HTML）

privacy:
  enable: true
  title: "隐私政策"
  extra_content: ""
```

### 外链重定向

外链点击时跳转确认页面，保障用户安全。

```yaml
redirect:
  enable: true
  source: "DoraTiger 的次元"
  exclude:
    - "your-domain.com"    # 自己的域名必须加入
```

### 404 页面

```yaml
page404:
  enable: true
  redirect_delay: 5000    # 自动跳转延迟（毫秒）
```

> ⚠️ Hexo 生成的是静态文件，404 功能需要 web server 配合。

**各平台配置方式：**

| 平台 | 自动生效 |
|------|----------|
| GitHub Pages / Vercel / Netlify | ✅ |
| Nginx | ❌ 需手动配置 |

**Nginx：**
```nginx
error_page 404 /404.html;
location = /404.html {
    root /path/to/hexo/public;
    internal;
}
```

**Apache：**
```apache
ErrorDocument 404 /404.html
```

### 搜索

```yaml
search:
  enable: true
  type: "algolia"    # algolia | local
```

#### Algolia 搜索

需安装 `algoliasearch` SDK：

```bash
npm install algoliasearch
```

主题内置索引管理命令：

```bash
hexo algolia           # 更新索引
hexo algolia --clean   # 清空后更新索引
hexo algolia --dry-run # 本地预览索引内容
```

配置：

```yaml
algolia:
  app_id: "YOUR_APP_ID"
  api_key: "YOUR_INDEX_API_KEY"
  search_key: ""        # 搜索专用 Key，留空用 api_key
  index_name: ""
  fields:               # 索引字段
    - title
    - slug
    - excerpt
    - permalink
    - date
    - updated
    - tags
    - categories
    - layout
  hit:
    per_page: 10
    empty: "找不到内容"
    placeholder: "搜索文章"
```

#### 本地搜索

无需安装外部插件，主题自建索引生成器。

```yaml
local:
  hits:
    per_page: 10       # 每页显示数量
  path:
    - search.json      # 索引文件路径
  field:
    - post
    - page             # 默认同时索引文章和页面
  field_merge_strategy: "merge"  # merge | replace
  content: false       # 是否索引正文全文
  content_max_length: 5000  # 正文索引长度上限（content=true 时生效）
  hit:
    placeholder: "搜索文章"
    empty: "找不到内容"
```

说明：
1. `field` 同时包含 `post` 和 `page` 不会默认导致重复；主题会按 URL 去重。
2. 若站点中存在同 URL 的 post/page（非常规情况），后写入项会被去重逻辑忽略。

#### 主题配置与用户配置合并差异（local 搜索逐项说明）

Hexo 的主题配置默认采用 deepMerge，数组按索引合并，不是整数组替换。下面是 local 搜索相关字段的差异说明。

| 配置项 | 主题默认配置 | 用户配置行为 | 最终合并结果 | 备注 |
|---|---|---|---|---|
| `search.local.hits.per_page` | `10` | 标量覆盖 | 以用户值为准 | 常规覆盖 |
| `search.local.path` | `['search.json']` | 数组合并 | 可能保留默认尾项 | 生成器已兼容 string/array，并归一化路径 |
| `search.local.field` + `field_merge_strategy=merge` | `['post','page']` | 数组合并 | 可能保留默认 `page` | 当前默认策略 |
| `search.local.field` + `field_merge_strategy=replace` | `['post','page']` | 读取用户原始配置 | 以用户数组为准 | 用于“严格覆盖”数组 |
| `search.local.content` | `false` | 标量覆盖 | 以用户值为准 | `true` 时生成 content 字段 |
| `search.local.content_max_length` | `5000` | 标量覆盖 | 以用户值为准 | 仅 `content=true` 时生效 |
| `search.local.hit.placeholder` | `搜索文章` | 深层对象覆盖 | 以用户值为准 | 未配置则沿用默认 |
| `search.local.hit.empty` | `找不到您查询的内容` | 深层对象覆盖 | 以用户值为准 | 未配置则沿用默认 |

推荐：
1. 希望“用户写什么就只用什么”时，将 `field_merge_strategy` 设为 `replace`。
2. 希望“保留主题默认项并增量补充”时，使用 `merge`。

**Front-matter 控制：**

```markdown
---
search: false          # 排除此文章
password: xxx          # 加密文章默认不索引
search: true           # 强制索引加密文章
---
```

### 统计

```yaml
statistics:
  enable: true
  type: "counter"    # busuanzi | counter
```

#### busuanzi

第三方服务，国内可能不稳定。

```yaml
busuanzi:
  pv: true
  uv: true
```

#### counter（自建）

轻量级，无需后端。

```yaml
counter:
  api: ""      # 留空用 localStorage，填后端地址调 API
  uv: true
```

API 模式：`GET /count?page=<path>` → `{ site: number, page: number }`

### 评论

```yaml
comment:
  enable: false
  type: "twikoo"    # gitment | valine | twikoo
```

**Gitment**（GitHub Issues）：需 `owner`、`repo`、`client_id`、`client_secret`。

**Valine**（LeanCloud）：需 `appId`、`appKey`。

**Twikoo**（自部署）：需 `envId`。

---

## 附录

### 构建缓存说明

当修改 `scripts/filters/*` 这类构建期逻辑（如代码块过滤器）后，建议执行：

```bash
npx hexo clean && npx hexo generate
```

避免 Hexo db 缓存导致 `public/` 目录仍保留旧 HTML。

### Commit Message 规范

详见 [贡献指南](./CONTRIBUTING.md)（中文）| [Contributing](./CONTRIBUTING_en.md)（English）。

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

需安装 `hexo-generator-searchdb`。

```yaml
local:
  hits: { per_page: 10 }
  path: [local-search.xml]
  field: [post]
  content: false
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

### Commit Message 规范

详见 [贡献指南](./CONTRIBUTING.md)（中文）| [Contributing](./CONTRIBUTING_en.md)（English）。

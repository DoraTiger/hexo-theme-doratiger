# Hexo Theme DoraTiger 配置文档

> 所有配置均在 `_config.hexo-theme-doratiger.yml` 中修改，不要直接改主题源码。

---

## 全局配置

```yaml
global:
  hello: true                          # 控制台启动提示
  favicon: /images/favicon_default.png # 浏览器标签图标
  avatar: /images/avatar_default.png   # 默认头像
```

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `hello` | bool | `true` | 启动时在控制台显示主题 logo |
| `favicon` | string | `/images/favicon_default.png` | 浏览器标签页图标路径 |
| `avatar` | string | `/images/avatar_default.png` | 默认用户头像路径 |

---

## 侧边栏配置

```yaml
sidebar:
  info:
    enable: true
    user: ""       # 留空使用 hexo _config.yml 的 author
    avatar: ""     # 留空使用 global.avatar
    intro: ""      # 留空使用 hexo _config.yml 的 description
  social:
    enable: true
    item:
      - { text: "Github", url: "https://github.com/DoraTiger" }
      - { text: "E-Mail", url: "mailto:xxx@example.com" }
  toc:
    enable: true
    number: false
    depth: 3
  friendlink:
    enable: true
    item:
      - { text: "站点名", url: "https://example.com" }
```

### sidebar.info — 用户信息

| 字段 | 说明 |
|------|------|
| `enable` | 是否显示用户信息卡片 |
| `user` | 用户名，留空使用 `hexo.config.author` |
| `avatar` | 头像路径，留空使用 `global.avatar` |
| `intro` | 个人简介，留空使用 `hexo.config.description` |

### sidebar.social — 社交链接

| 字段 | 说明 |
|------|------|
| `enable` | 是否显示社交链接 |
| `item` | 链接数组，每项含 `text`（显示文本）和 `url`（链接地址） |

### sidebar.toc — 文章目录

| 字段 | 说明 |
|------|------|
| `enable` | 文章页是否显示目录 |
| `number` | 是否显示目录编号 |
| `depth` | 目录深度（1-6） |

### sidebar.friendlink — 友链

| 字段 | 说明 |
|------|------|
| `enable` | 是否显示友链 |
| `item` | 友链数组，格式同社交链接 |

---

## 导航栏配置

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
    enable: true
```

| 字段 | 说明 |
|------|------|
| `menu` | 导航菜单数组，`key` 对应 `languages/*.yml` 中的翻译 |
| `time` | 是否在右上角显示当前时间 |

**内置菜单 key：** `home`、`archives`、`categories`、`tags`、`about`、`terms`、`privacy`、`redirect`、`page404`

---

## 页脚配置

```yaml
footer:
  since:
    enable: true
    year: 2018
  beian:
    miit:
      enable: false
      text: ""
      link: "https://beian.miit.gov.cn"
    mps:
      enable: false
      text: ""
      link: ""
      icon: "/images/police_beian.png"
```

### footer.since — 网站运行时间

显示在页脚，格式为 `©2018 ～ 2026 By 作者名`。

| 字段 | 说明 |
|------|------|
| `enable` | 是否显示 |
| `year` | 网站创建年份 |

### footer.beian — 备案信息

适用于中国大陆服务器。

| 字段 | 说明 |
|------|------|
| `miit.enable` | 是否显示工信部备案号 |
| `miit.text` | 备案号文本 |
| `miit.link` | 备案查询链接 |
| `mps.enable` | 是否显示公安部备案号 |
| `mps.text` | 公安备案号 |
| `mps.link` | 公安备案链接 |
| `mps.icon` | 公安备案图标 |

---

## 搜索配置

```yaml
search:
  enable: true
  type: "algolia"    # algolia | local
```

### Algolia 搜索

需要安装 `hexo-algolia` 插件并配置 API Key。

```yaml
algolia:
  hit:
    per_page: 10
    empty: "找不到您查询的内容"
    placeholder: "搜索文章"
  app_id: "YOUR_APP_ID"
  api_key: "YOUR_INDEX_API_KEY"
  search_key: "YOUR_SEARCH_API_KEY"  # 留空则使用 api_key
  index_name: "YOUR_INDEX_NAME"
  fields:
    - title
    - slug
    - excerpt
    - permalink
    - date
    - updated
    - tags
    - categories
    - layout
```

### 本地搜索

需要安装 `hexo-generator-searchdb` 插件。

```yaml
local:
  hits:
    per_page: 10
  path:
    - local-search.xml
  field:
    - post
  content: false
```

---

## 统计配置

```yaml
statistics:
  enable: true
  type: "counter"    # busuanzi | counter
```

### busuanzi

第三方统计服务，国内访问可能不稳定。

```yaml
busuanzi:
  pv: true   # 页面访问量
  uv: true   # 独立访客数
```

### counter（自建）

轻量级统计，无需后端。

```yaml
counter:
  api: ""    # API 地址，留空使用 localStorage
  uv: true
```

**API 模式：** `api` 填写后端地址，前端调用 `GET /count?page=<path>`，需返回 `{ site: number, page: number }`。

**localStorage 模式：** `api` 留空，使用浏览器本地存储记录访问，适合个人博客。

---

## 评论配置

```yaml
comment:
  enable: false
  type: "twikoo"    # gitment | valine | twikoo
```

### Gitment

基于 GitHub Issues 的评论系统。

```yaml
gitment:
  owner: "GitHub 用户名"
  repo: "仓库名"
  client_id: "OAuth App Client ID"
  client_secret: "OAuth App Client Secret"
```

### Valine

基于 LeanCloud 的无后端评论。

```yaml
valine:
  appId: "LeanCloud App ID"
  appKey: "LeanCloud App Key"
  placeholder: "欢迎评论"
```

### Twikoo

自部署评论系统。

```yaml
twikoo:
  envId: "https://your-twikoo-server.vercel.app"
```

---

## 首页配置

```yaml
home:
  auto_excerpt:
    enable: true
    length: 200     # 摘要字数
  post_meta:
    date: true
    update: true
    categories: true
    tags: true
    excerpt: true
```

| 字段 | 说明 |
|------|------|
| `auto_excerpt.enable` | 是否自动截取摘要 |
| `auto_excerpt.length` | 摘要字数限制，建议配合 `<!-- more -->` 使用 |
| `post_meta.*` | 首页文章卡片显示的元信息 |

---

## 文章页配置

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

### post.highlight — 代码高亮

| 字段 | 说明 |
|------|------|
| `enable` | 是否开启代码高亮 |
| `type` | 高亮引擎（目前仅 `highlight.js`） |
| `line_number` | 是否显示行号 |
| `copy` | 是否显示复制按钮 |

### post.copyright — 版权声明

文章底部自动显示版权声明，引用许可证协议。

| 字段 | 说明 |
|------|------|
| `enable` | 是否开启 |
| `license` | 许可证名称（如 `CC BY-NC-SA 4.0`） |
| `link` | 许可证链接 |
| `email` | 作者邮箱 |

---

## 特殊页面配置

### 404 页面

```yaml
page404:
  enable: true
  redirect_delay: 5000    # 自动跳转延迟（毫秒）
```

### 关于页面

```yaml
about:
  enable: true
```

内容写在 `source/about/index.md` 中。

### 重定向页面

外链点击时跳转到确认页面，保障用户安全。

```yaml
redirect:
  enable: true
  source: "DoraTiger 的次元"   # 离站提示文案
  method: "exlude"
  include: []
  exlude:
    - "127.0.0.1"
    - "localhost"
    - "your-domain.com"
```

| 字段 | 说明 |
|------|------|
| `enable` | 是否开启外链拦截 |
| `source` | 离站提示中的站点名称 |
| `exlude` | 不拦截的域名列表（自己的域名必须加入） |

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

### robots.txt

```yaml
robots:
  enable: true
  disallow:
    - /admin/
    - /api/
    - /tmp/
```

自动生成，URL 从 `hexo.config.url` 自动取。

---

## 样式配置

```yaml
style:
  color:
    theme: "rgba(230, 119, 0, 1)"           # 主题色
    sub_theme: "rgba(73, 177, 245, 1)"      # 次主题色
    text: "rgba(255, 255, 255, 1)"          # 文本色
    sidebar_background: "rgba(255, 255, 255, 0.1)"
    content_background: "rgba(255, 255, 255, 0.1)"
    button_background: "rgba(255, 255, 255, 0.1)"
    code_background: "rgba(255, 255, 255, 0.1)"
    border: "rgba(128, 128, 128, 0.8)"
    border_shadow: "rgba(0, 0, 0, 0.5)"
  font:
    size: "16px"
  sidebar:
    width: "300px"
  main:
    header:
      height: "3rem"
      border_botton: "1px solid rgba(128, 128, 128, 0.8)"
    content:
      max_width: "1200px"
      padding: "1rem"
    footer:
      height: "3rem"
      border_top: "1px solid rgba(128, 128, 128, 0.8)"
```

所有颜色支持 `rgba()` 和 `hex` 格式。改 `style.color.theme` 即可全局换色。

---

## 资源配置

### 全局 CDN 开关

```yaml
resource:
  enable_cdn: false    # true 使用 CDN | false 使用本地
```

### 单项资源 CDN

每个资源可独立控制：

```yaml
highlight.js:
  enable_cdn:          # 留空跟随全局 | true 强制 CDN | false 强制本地
  local:
    css: ["/lib/highlight.js/@11.10.0/styles/github-dark.min.css"]
    js: ["/lib/highlight.js/@11.10.0/highlight.min.js"]
  cdn:
    css: ["https://cdn.jsdelivr.net/..."]
    js: ["https://cdn.jsdelivr.net/..."]
  script: |            # 初始化脚本
    hljs.configure({...});
    hljs.highlightAll();
```

**支持的资源：** `busuanzi`、`highlight.js`、`prism.js`、`gitment`、`twikoo`、`valine`、`algolia`

### 第三方资源

```yaml
thirdpary:
  font_awesome:
    enable_cdn:
    local: { css: ["/lib/font-awesome/@6.7.2/css/all.min.css"] }
    cdn: { css: ["https://cdnjs.cloudflare.com/..."] }
  mathjax:
    enable_cdn:
    local: { js: ["/lib/mathjax/@3.2.2/tex-mml-chtml.js"] }
    cdn: { js: ["https://www.unpkg.com/..."] }
```

---

## 多语言

翻译文件在 `languages/` 目录下：

| 文件 | 语言 |
|------|------|
| `zh-Hans.yml` | 简体中文 |
| `zh-Hant.yml` | 繁体中文 |
| `en.yml` | English |

使用 `_config.yml` 的 `language` 字段指定语言。

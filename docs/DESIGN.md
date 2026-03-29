# Hexo Theme DoraTiger 设计文档

> 最后更新: 2026-03-29

---

## 1. 整体架构

```
┌─────────────────────────────────────────────────┐
│                   _config.yml                    │
│              (主题配置 + 用户覆盖)                │
├─────────────────────────────────────────────────┤
│                scripts/                         │
│  generators/ │ filters/ │ events/ │ injectors/  │
│  (构建时逻辑: 生成页面、过滤内容、注入资源)       │
├─────────────────────────────────────────────────┤
│                layout/                          │
│  *.pug (页面模板)  +  _include/ (组件)          │
├─────────────────────────────────────────────────┤
│              source/css/                        │
│  main.styl → _variable/ → _mixins/ → _layout/  │
├─────────────────────────────────────────────────┤
│              source/js/                         │
│  main.js (ES Module 入口) → layout/ + utils/    │
└─────────────────────────────────────────────────┘
```

---

## 2. CSS 颜色体系

### 核心机制：Stylus 编译时变量

主题使用 **Stylus 变量**（`$color-*`），在编译时从 `_config.yml` 读取并写入 CSS。不使用 CSS 自定义属性（`var(--*)`）。

**定义位置：** `source/css/_variable/variable.styl`

```stylus
$color-theme = theme-config('style.color.theme', 'rgba(230, 119, 0, 1)');
$color-sub-theme = theme-config('style.color.sub_theme', 'rgba(73, 177, 245, 1)');
$color-text = theme-config('style.color.text', 'rgba(255, 255, 255, 1)');
$color-background = theme-config('style.color.background', 'radial-gradient(...)');
$color-content-background = theme-config('style.color.content_background', 'rgba(255, 255, 255, 0.1)');
$color-sidebar-background = theme-config('style.color.sidebar_background', $color-content-background);
$color-button-background = theme-config('style.color.button_background', $color-content-background);
$color-code-background = theme-config('style.color.code_background', $color-content-background);
$color-border = theme-config('style.color.border', 'rgba(128, 128, 128, 0.8)');
```

### 变量使用统计

| 变量 | 使用次数 | 用途 |
|------|---------|------|
| `$color-theme` | 32 | 主题色（标题、按钮、高亮） |
| `$color-text` | 21 | 文字颜色 |
| `$color-content-background` | 15 | 内容区背景 |
| `$color-button-background` | 8 | 按钮背景 |
| `$color-sub-theme` | 10 | 次主题色（链接、图标） |
| `$color-border` | 4 | 边框颜色 |
| `$color-background` | 2 | 全局背景 |
| `$color-sidebar-background` | 2 | 侧边栏背景 |
| `$color-code-background` | 3 | 代码块背景 |

### CSS 导入顺序（main.styl）

```
1. _function/*     — 功能函数
2. _variable/*     — 变量定义（$color-*）
3. _animation/*    — 动画关键帧
4. _mixins/*       — 复用样式（hover-underline, border-animation, button-hover-effect）
5. _layout/*       — 布局样式（按字母顺序导入）
6. highlight/*     — 代码高亮
```

### 新文件的 CSS 变量使用

`redirect.styl`、`404.styl`、`encrypt.styl` 等较新的文件使用了 `var(--theme-color)` 等 CSS 变量，但这些变量**从未在任何地方定义**。这些引用会 fallback 到浏览器默认值（initial），可能导致这些页面在某些浏览器上样式异常。

---

## 3. JavaScript 模块系统

### 入口：main.js（ES Module）

```javascript
import Background from "./layout/backgroud.js";
import ScrollHandler from "./utils/scroll.js";
import { initClock, ... } from "./layout/header.js";
import { initToggleSidebar, ... } from "./layout/sidebar.js";
// ... 其他模块

document.addEventListener("DOMContentLoaded", () => {
    // 所有初始化函数在此调用
    new Background();
});
```

### 模块导出方式

| 文件 | 导出类型 | 导出内容 |
|------|---------|---------|
| `backgroud.js` | `export default` | `Background` 类 |
| `scroll.js` | `export default` | `ScrollHandler` 类 |
| `header.js` | `export { named }` | 4 个函数 |
| `sidebar.js` | `export { named }` | 2 个函数 |
| `footer.js` | `export { named }` | 1 个函数 |
| `codeCopy.js` | `export { named }` | 1 个函数 |
| `PageVisibility.js` | `export { named }` | 1 个函数 |
| `localSearch.js` | IIFE（非模块） | 自执行 |

### 加载方式

- **main.js**：通过 injector 注入为 `<script type="module">`（head 区域）
- **localSearch.js**：通过 header.pug 的 `<script>` 标签直接加载
- **algolia 相关**：通过 CDN `<script>` 标签加载

---

## 4. Pug 模板结构

### 布局继承

```
_layout.pug (根布局)
├── head.pug (meta + CSS + JSON-LD)
├── canvas#universe (星空背景)
├── sidebar.pug
│   ├── info.pug (用户信息)
│   └── toc.pug (文章目录)
├── header.pug (导航 + 搜索)
├── content (block 插槽)
├── footer.pug (版权 + 统计)
└── 内联 script (重定向拦截)
```

### 页面模板

| 模板 | 继承 | 用途 |
|------|------|------|
| `index.pug` | _layout | 首页 |
| `post.pug` | _layout | 文章页 |
| `archive.pug` | _layout | 归档页 |
| `categories.pug` | _layout | 分类列表 |
| `category.pug` | _layout | 单个分类 |
| `tags.pug` | _layout | 标签列表 |
| `tag.pug` | _layout | 单个标签 |
| `about.pug` | _layout | 关于页 |
| `404.pug` | _layout | 404 页 |
| `redirect.pug` | _layout | 重定向页 |
| `terms.pug` | _layout | 服务条款 |
| `privacy.pug` | _layout | 隐私政策 |

---

## 5. Scripts 架构（构建时逻辑）

### Generators（页面生成器）

| 文件 | 功能 |
|------|------|
| `index.js` | 首页分页 |
| `about.js` | 关于页 |
| `404.js` | 404 页 |
| `robots.js` | robots.txt |
| `sitemap.js` | sitemap.xml/txt |
| `terms.js` | 服务条款页 |
| `privacy.js` | 隐私政策页 |
| `tags.js` | 标签页 |
| `categories.js` | 分类页 |
| `redirect.js` | 重定向页 |
| `local-search.js` | search.json 索引 |

### Filters（内容过滤器）

| 文件 | 阶段 | 功能 |
|------|------|------|
| `code.js` | after_post_render | 代码高亮 + 行号 |
| `redirect.js` | after_post_render | 外链拦截标记 |
| `encrypt.js` | after_post_render | 文章加密 |

### Injectors（资源注入器）

| 文件 | 功能 |
|------|------|
| `injector-resource.js` | CSS/JS 资源注入 |
| `injector-comments.js` | 评论系统脚本 |
| `injector-search.js` | 搜索配置注入 |
| `injector-config.js` | 主题配置注入 |

---

## 6. 配置体系

### 配置优先级

```
1. 主题 _config.yml (默认值)
2. _config.hexo-theme-doratiger.yml (用户覆盖)
3. 文章 front-matter (单篇覆盖)
```

### 关键配置路径

```
theme.style.color.*     → CSS 编译时变量
theme.sidebar.*         → 侧边栏配置
theme.header.*          → 导航栏配置
theme.post.*            → 文章页配置
theme.search.*          → 搜索配置
theme.statistics.*      → 统计配置
theme.encrypt.*         → 加密配置
theme.sitemap.*         → Sitemap 配置
```

---

## 7. 关键约束（修改时必须遵守）

1. **不修改现有 CSS 文件** — 只新增文件
2. **不修改 JS 模块导出** — `export default` 和 `export { named }` 不能变
3. **不修改 `_layout.pug` 的 script 加载顺序** — main.js 必须在 body 最后
4. **Stylus 变量不能被 CSS 变量覆盖** — 因为 Stylus 变量是编译时固定的
5. **`main.styl` 的 `@import` 顺序不能变** — 影响 CSS 优先级
6. **`button-hover-effect()` mixin 使用 `$color-button-background`** — 这是编译时固定的

---

## 8. 已知问题

- 无

# Hexo Theme DoraTiger 设计文档

> 最后更新: 2026-09-05

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

## 2. CSS-HTML 结构对齐原则 🎯

### 核心理念

**Stylus CSS 类名嵌套结构与 Pug HTML 元素的类名层级保持一致，确保代码可读性和可维护性。**

**重要限制**：此原则只适用于 **纯 class 体系**。包含 ID 选择器的模块需要特殊处理。

### 选择器类型限制

| 情况 | 处理方式 | 示例 |
|------|--------|------|
| **纯 class 体系** | ✅ 完全对齐（递归嵌套） | `.post-item { &-header { &-title } }` → `.post-item-header-title` |
| **ID 选择器体系** | ⚠️ 逐个定义（不用递归） | `#header-left { }`, `#header-right { }` 分开写 |
| **混合 ID+class** | ⚠️ 保持原状 | `#footer-right { }` 下的 `.footer-right-separator` 单独定义 |
| **第三方生成的 HTML** | ⚠️ 不强行改变 | Hexo 插件生成的结构应保持现状 |

### 对齐规则详解

#### 规则 1：仅对 class 使用递归嵌套

**✅ 正确**（Pug class → Stylus `&-`）：
```stylus
.post-item {
  &-header { &-title { } }      // → .post-item-header-title
  &-copyright { &-info { } }    // → .post-item-copyright-info
}
```

**❌ 错误**（ID 递归生成错误的选择器）：
```stylus
#archive {
  &-title { }                   // ❌ 编译成 #archive-title（ID），但 HTML 是 .archive-title（class）
}
```

#### 规则 2：ID 选择器保持扁平化

**✅ 正确**（分别定义）：
```stylus
#header-left { }
#header-left-menu-icon { }     // 如果需要嵌套，用自定义选择器
#header-right { }
```

**或保持嵌套但加前缀**：
```stylus
#header-left {
  &#-menu-icon { }             // 这样仍然生成 #header-left-menu-icon
  &#-menu-list { }             // 仍然生成 #header-left-menu-list
}
```

#### 规则 3：混合体系中class需特殊处理

**✅ 正确**（ID 顶层，class 子元素）：
```stylus
#footer-right {
  .footer-right-separator { }  // 不用 &-，直接用类名
  .footer-right-statistics { }
}
```

### 对齐检查清单

修改 CSS 或 HTML 时，按以下顺序检查：

1. **确定选择器类型**
   - [ ] 该组件在 Pug 中用的是 `.class-name` 还是 `#id-name`？
   
2. **应用对齐规则**
   - [ ] 如果是 class，所有子元素也必须是 class，使用 `&-` 嵌套
   - [ ] 如果是 ID，子元素要么也是 ID（扁平定义），要么是独立的 class（不用嵌套）
   
3. **验证编译结果**
   - [ ] 检查 `.css` 输出，确保生成的选择器与 HTML 中的 `class=""` 或 `id=""` 相匹配
   
4. **测试页面**
   - [ ] 在浏览器中验证样式是否正常应用

### 现状模块分类

| 模块 | 选择器类型 | 对齐状态 | 说明 |
|------|-----------|--------|------|
| post | class | ✅ 完全对齐 | 纯 class 体系，递归嵌套正确 |
| header | ID | ⚠️ 部分对齐 | ID 顶层正确，子元素需验证 |
| footer | 混合 | ⚠️ 保持原状 | ID 顶层 + class 子组件，无需改 |
| sidebar | class | ⚠️ 部分对齐 | 存在一些手写的扁平选择器 |
| archive | 混合 | ❌ 不一致 | Pug 用 class（`.archive-title`），Stylus 用 ID（`#archive-title`） |
| tags | 混合 | ❌ 不一致 | Pug 用 class（`.tags-title`），Stylus 用 ID（`#tags-title`） |
| categories | 混合 | ❌ 不一致 | Pug 用 class（`.categories-title`），Stylus 用 ID（`#categories-title`） |

**重要说明**：archive、tags、categories 的不一致是由于 Hexo 插件生成的 HTML 结构使用 class，但 Stylus 中也定义了 ID 版本（可能出于兼容性）。**不应强行改变这些，应保持现状以兼容 Hexo 插件逻辑。**

---

## 3. CSS 颜色体系

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

### CSS 变量使用现状

主题样式已统一为 Stylus 编译时变量（`$color-*`），当前 `source/css/` 下未使用 `var(--*)` 形式的 CSS 自定义变量，避免了运行时变量未定义带来的样式漂移问题。

---

## 3. JavaScript 模块系统

### 入口：main.js（ES Module）

```javascript
import Background from "./layout/background.js";
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
| `background.js` | `export default` | `Background` 类 |
| `scroll.js` | `export default` | `ScrollHandler` 类 |
| `header.js` | `export { named }` | 4 个函数 |
| `sidebar.js` | `export { named }` | 2 个函数 |
| `footer.js` | `export { named }` | 1 个函数 |
| `codeCopy.js` | `export { named }` | 1 个函数 |
| `PageVisibility.js` | `export { named }` | 1 个函数 |
| `localSearch.js` | IIFE（非模块） | 自执行 |

### 加载方式

- **main.js**：通过 injector 注入为 `<script type="module">`（body 结束前）
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

### 生命周期与配置可见性

`scripts/index.js` 是 Hexo 构建期脚本的唯一入口；各目录仍按职责拆分。主题在 `ready` 阶段先读取主题默认配置与根目录 `_config.hexo-theme-doratiger.yml`，将合并结果保存到 `hexo.doratiger.config`。这样，依赖主题变量的构建期逻辑不必等待模板渲染。

在 `generateBefore` 阶段，主题会再次合并已由 Hexo 处理完的历史 `source/_data/doratiger_config.yml`，再将结果发布到 `theme.config`，并在此后注册 injector。模板、生成器和资源注入器因此消费同一份最终配置；历史配置兼容逻辑不能仅依赖 Hexo 的自动主题配置合并替代。

### 内部 URL 约定

主题内的站内路径（模板、默认资源与本地资源清单）必须通过 Hexo `url_for` 解析，逻辑路径可写成 `/images/avatar.png` 或 `/archives`。这样站点 `root` 为 `/` 与子路径（如 `/blog/`）时都会生成正确地址。完整 HTTP(S)、`mailto:` 等外部地址保持原值，不应手动拼接站点根路径。

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

1. **模板与样式命名必须对齐**：Pug 的 class/id 变更需同步到 Stylus 与 JS 选择器。
2. **JS 模块导出风格保持稳定**：默认导出与具名导出不要随意变更，避免入口调用失配。
3. **入口初始化顺序应保持可预期**：`main.js` 中初始化函数尽量保持“布局 -> 交互 -> 功能”顺序。
4. **样式优先使用 Stylus 编译时变量**：统一使用 `$color-*`，避免引入未定义的运行时 CSS 变量。
5. **修改构建期过滤器后建议全量重建**：执行 `npx hexo clean && npx hexo generate`，防止 db 缓存导致产物未更新。

---

## 8. 已知问题

- `Canvas` 星空会根据视口调整粒子数量，但低性能移动设备仍可能出现掉帧；目前没有统一的性能降级开关。
- Hero 文字在侧边栏切换等动态布局变化后依赖 `layoutchange` 重新计算，部分窄屏组合仍可能出现居中偏差。
- 主题保留了部分第三方生成结构和历史 ID/class 选择器以维持兼容，不能只根据命名一致性做机械重构。
- 主题缺少覆盖全部配置组合的自动化浏览器测试；涉及响应式、搜索、加密、评论或本地/CDN 资源切换时仍需人工页面验证。

---

## 9. JavaScript 开发规范

### 运行环境边界

主题包含三类 JavaScript，模块规范不能混用：

| 位置 | 运行环境 | 模块规范 |
|------|----------|----------|
| `source/js/` | 浏览器 | ES Module（`import` / `export`） |
| `scripts/` | Hexo / Node.js 构建期 | CommonJS（`require` / `module.exports`） |
| Pug 内联脚本 | 浏览器页面 | 普通 `<script>`；保持短小，复杂逻辑移入 `source/js/` |

浏览器模块和构建期脚本都优先使用 ES6+ 语法：

- **变量声明**：使用 `const` / `let`，禁止 `var`
- **函数**：回调优先使用箭头函数；需要动态 `this`、声明提升或 Hexo 约定签名时可以使用 `function`
- **类**：有明确状态和生命周期的浏览器组件可以使用 `class`
- **模块**：按目录边界选择 ESM 或 CommonJS，不为形式统一跨运行环境改写
- **字符串**：需要插值或多行内容时使用模板字符串
- **解构**：使用 `const { a, b } = obj`
- **异步**：使用 `async/await`

### 现有代码风格

```
class Background {
    constructor() { ... }
    draw() { ... }
}
export default Background;

// 使用
import Background from "./layout/background.js";
new Background();
```

### 修改约束

- 新增浏览器端复杂逻辑不得继续堆入 Pug 内联脚本，应放入 `source/js/` 并由 `main.js` 初始化。
- `source/js/` 不引入 CommonJS；`scripts/` 不假定浏览器 DOM 存在。
- 修改模块导出方式时同步检查所有导入、injector 注入方式和构建产物。
- 历史内联脚本中的 `var` 可以在相关功能修改时逐步收敛，不做脱离行为验证的批量替换。

---

## 10. 验证矩阵

主题依赖宿主 Hexo 项目完成构建。在博客根目录执行：

```bash
npm run clean
npm run build
```

按变更范围检查：

| 变更 | 最低验证范围 |
|------|--------------|
| Pug / Stylus | 首页、文章页、对应列表页，桌面与窄屏 |
| 浏览器端 JS | 首次加载、重复交互、缺少可选 DOM 节点时无异常 |
| Generator / Filter | 全量清理构建，检查生成路径和文章渲染结果 |
| 搜索 | 本地搜索或 Algolia 对应模式、空结果、长标题和窄屏 |
| 加密 / 外链重定向 | 正确密码、错误密码、站内链接、外链和特殊协议 |
| 配置 / i18n | 默认配置、用户覆盖配置、`zh-Hans` 与 `en` 关键页面 |
| 资源加载 | 本地资源模式；涉及 CDN 时再检查 CDN 覆盖模式 |
| 生命周期 / 站内路径 | 使用最小站点分别验证 `root: /` 与子路径 `root: /blog/`；确认 CSS、JS、头像/SEO、导航、404 与重定向地址 |

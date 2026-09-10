# Hexo Theme DoraTiger 设计文档

> 最后更新: 2026-09-05

---

## 1. 整体架构

### Canonical 与收录元数据

`scripts/utils/canonical.js` 独立处理当前地址、首选部署前缀、文章覆盖和 sitemap 收录资格，不依赖 multi、不改变实际访问链接。使用 Hexo URL helper 保持编码和 pretty URL 语义，统一归一化目录首页。`seo-metadata` helper 提供地址并安全序列化 JSON-LD，Pug 只输出标签；文章 `mainEntityOfPage` 跟随 canonical，`og:url` 保留当前部署绝对地址。

`scripts/utils/sitemap.js` 统一计算条目与文件计划：sitemap 生成器负责 XML/TXT 序列化，robots 仅声明计划中的文件，不依赖生成器执行顺序。跨域镜像无规范条目时不生成空 sitemap，也不添加抓取禁令。

`tests/canonical.test.cjs` 使用真实 Hexo CLI 验证普通与 multi 构建、分页、中文与子目录、全站/单页开关、同站别名、镜像独有页面、JSON-LD、非法地址和 sitemap/robots 一致性；在磁盘缓存临时目录测试，不调用远端发布。

### 多目标构建、预览与发布

`algolia-target.js` 只负责目标命令编排，复用 resolve/capture/prepare 与真实 Hexo CLI，先 generate 再运行原 Algolia 命令，finally 清理临时副本；不重复配置合并、不借用公共数据库、不接入 Git 发布。`site.js` 在共享准备入口拒绝环境索引与目标显式索引冲突，保持页面查询和远端写入一致。目标命令默认远端更新仍需用户显式执行，测试使用 dry-run。

`pages.js` 独立负责 `publish.pages` 校验与 GitHub Pages 文件适配。真实 Hexo 生成后、产物树摘要记录前，按目标显式添加 `.nojekyll` 和可选 `CNAME`；源文件/生成器 CNAME 冲突拒绝，不推断站点域名、不修改共享 source，也不耦合 Git transport。`multi-pages.test.cjs` 使用真实 CLI 与本地裸仓库验证目标隔离、文件复用/冲突、关闭与省略配置、重复推送及篡改拒绝。命令仍为 `multi-*`，帮助描述标明 DoraTiger 来源。

本地回归需将 `TMPDIR` 指向磁盘缓存目录（例如 `~/.cache/hexo-theme-doratiger`），避免大体积副本占满 tmpfs；串行执行，测试结束清理副本，仅保留需要的日志。中断后核实进程与目录归属再清理，不删除开发 worktree 或用户备份。

Git 错误诊断由 `diagnostics.js` 单独分类，`process.js` 仅附带白名单元数据；console 在 `--debug` 时输出，不持久化原始 stderr、参数或环境。`multi-debug-cli.test.cjs` 通过真实 Hexo CLI 和拒绝推送的本地 hook 验证默认静默、调试分类及敏感信息不外泄。

输入快照区分内容与运行数据：宿主按允许的输入目录收集，主题根目录排除构建缓存与开发文档；内容中的 `public/`、`db.json` 不按名称删除。敏感元数据仍逐层排除，其他静态内容交给真实 Hexo 的 `skip_render`、`include`、`exclude` / `ignore` 处理。构建与预览共用该边界，不再维护独立静态文件发布规则。

`multi-generate/multi-push/multi-deploy` 在 console 埋点无条件注册，执行时检查公共主题配置。Hexo 根目录的主题主配置 `_config.hexo-theme-doratiger.yml` 统一管理 `multi_deploy` 开关、运行参数、目标注册和全部 `publish` 参数；主题仓库的 `_config.yml` 提供默认模板。目标子配置只含 `site` 与 `theme`，仅负责个性化覆盖，不承载发布参数，也不能重定义 `multi_deploy`。前者用于隔离目录中的有效站点配置，后者通过私有构建上下文进入既有 `ready` 提前合并路径，优先级高于公共 `theme_config`；未填写字段继承公共配置，对象递归合并、数组替换、`false` 生效。普通构建不加载目标文件。

`scripts/utils/multi-deploy/` 按配置校验、文件边界、输入快照、构建记录、子进程调用拆分；`publishers/git.js` 仅接收已经验证的产物，`git-auth.js` 单独处理环境变量令牌和 HTTPS 认证。运行状态默认位于宿主 `plugins/multi_deploy`，不是主题脚本聚合目录。每个目标通过真实 Hexo CLI 在独立 cwd 构建，不在同一个实例中切换配置。Git 使用专属目录及显式分支，默认拒绝未知归属和非快进，不复用普通 deployer 的缓存。只有 `multi-push --force` 允许接管及强推，过期或篡改产物始终拒绝。提交信息可配置，内部 trailer 固定追加；姓名和邮箱按目标覆盖，不修改全局 Git。

`multi-server` 通过独立 console 入口调用 `server.js` 管理会话，`server-process.js` 管理长驻 Hexo CLI 子进程；`site.js` 为构建和预览共用的配置准备模块。配置重载复用 `themeConfig.js` 的合并函数，不另建优先级体系。默认模式轮询输入元数据，变更后从新快照重启，避免热更新遗漏配置、模板和已删除文章；真正复制时仍验证内容摘要。`server-snapshot.js` 为每次尝试分配独立私有目录，连续保存引发的快照竞态可重试，未完成副本立即回收，不移除仍在服务的旧副本；配置和渲染错误仍终止。预览位于系统私有临时目录，与发布工作目录分离，不占用长期发布锁。静态模式在短期锁内校验并复制最新产物，之后只服务副本，不更新 latest 或历史。

验证：`HEXO_HOST_DIR=/path/to/hexo node tests/multi-server.test.cjs` 使用真实 Hexo CLI 和 HTTP 检查目标/公共配置覆盖、根路径及子路径、源文件增删改、并行服务、端口冲突、退出清理，以及静态产物在后续生成/清理期间保持不变；不会推送真实远程。

认证测试：`HEXO_HOST_DIR=/path/to/hexo node tests/multi-deploy-auth.test.cjs` 使用临时 TLS 证书、HTTPS smart-HTTP 服务与本地裸仓库运行真实 Hexo CLI；验证令牌成功/失败、重定向拒绝及凭据不落盘，需要 OpenSSL 与 Git 2.31+，不连接真实托管平台。

运行维护由独立 `history.js` 与 `cleanup.js` 实现，通过 console 埋点注册 `multi-history` 和 `multi-clean`。记录在持锁运行中原子写入，网络 push 前标记阶段，网络失败或中断保守视作未确认；维护命令只解析公共目标名、运行目录和保留策略，不加载目标 profile 或连接远端。清理先生成完整清单，实际删除共用工作目录锁，按目标保留构建/记录、保护 latest，并保留其他目标仍引用的共享输入。CLI 集成测试覆盖清理预览/确认、锁与路径拒绝、保留规则、清理后再次推送及远端已成功但验证中断的记录语义。

测试：`HEXO_HOST_DIR=/path/to/hexo MULTI_KEEP_FIXTURE=1 node tests/multi-deploy.test.cjs` 创建本地 bare 目标并检查提交树、幂等、删除、失败与重试；随后 `node tests/multi-deploy-browser.cjs /tmp/doratiger-multi-test-<id>` 从这些仓库克隆部署结果，在 Chromium 检查日夜、窄屏、搜索和评论开关。浏览器测试需要 Node.js 22+ 与 Chromium；外部评论 API 被阻断，不代表真实评论服务的登录/发布已验证。

```
┌─────────────────────────────────────────────────┐
│                   _config.yml                    │
│     (主题默认配置 + 用户覆盖 + 站点侧 manifest)    │
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

## 3. 视觉系统

### 目标与边界

主题以“星空”为核心识别，不把它降格为单纯背景图。视觉系统升级为同一片天空的两种状态：默认 **夜航（night）** 保留深色星幕、月光金与冷蓝星光；可选 **日照（day）** 使用天空白、日晕、暖金与蓝灰，而不是纯白页面上放一个太阳图标。`system` 模式按系统偏好选择两者。

本轮允许破坏性调整主题样式配置与 DOM/CSS 选择器，但不改变文章内容、Hexo 路由、构建期扩展命令或 CDN 图片生命周期。主题不引入运行时第三方依赖。

### 设计令牌与配置边界

日常配置只暴露外观选择、两枚强调色、基础字号和两项布局尺度：

```yaml
style:
  appearance: night # night | day | system
  accent: "#E7A63A"
  accent_secondary: "#73C4F5"
  typography:
    font_size: 16px
  layout:
    content_width: 46rem
    sidebar_width: 18rem
```

`appearance` 确定生成页面的初始外观策略：`night` 和 `day` 固定使用对应状态；`system` 跟随 `prefers-color-scheme`。页头的月/日按钮可在浏览器本地覆盖初始策略，并在后续访问中保留该选择；这项偏好不回写主题配置，也不进入静态产物。

昼夜的画布、表面、正文、弱文字、边框、遮罩和代码区颜色属于主题内部令牌，不按“侧栏、按钮、代码块”等组件逐项暴露。这样常用配置保持短小，组件仍共享稳定的语义接口。

根模板在 `<html>` 写入外观策略；CSS 以 `data-appearance` 和 `prefers-color-scheme` 选择内部令牌。组件只使用 `--dt-canvas`、`--dt-surface`、`--dt-surface-raised`、`--dt-chrome`、`--dt-control`、`--dt-text`、`--dt-text-muted`、`--dt-border`、`--dt-code`、`--dt-accent` 和 `--dt-accent-secondary`。其中 `--dt-chrome` 专用于顶栏、侧栏和页脚，`--dt-control` 用于卡片中的次级操作，保持低对比度，让文章表面承担主视觉。内容区与侧栏滚动条也由昼夜令牌控制。现有 `style.color.*`、`style.font.*`、`style.sidebar.*` 和 `style.main.*` 均为已移除的破坏性旧接口。

### 昼夜配色

| 令牌层 | 夜航（默认） | 日照（可选） |
|------|------|------|
| 天幕 | 深靛蓝渐变与低密度星幕 | 偏蓝天空白、暖日晕与低对比度光尘 |
| 表面 | 有层级的半透明深色表面 | 略暖白表面与灰蓝边界 |
| 强调色 | 月光金，用于主操作与当前状态 | 更沉稳的日光金，保持同一语义 |
| 次强调色 | 冷蓝，用于链接与辅助定位 | 清晰但不刺眼的天蓝 |
| 文字 | 接近白的正文与蓝灰弱文字 | 深蓝灰正文与中性灰蓝弱文字 |

星空画布升级为可配置的天体背景模块：夜航绘制星光与彗星；日照绘制稀疏光尘和太阳方向的柔和光束。它必须遵守 `prefers-reduced-motion`，在标签页不可见时暂停，并在窄屏降低粒子密度。

### 版式与信息层级

- 页面使用固定视口 shell：顶栏、侧栏和页脚保持在视口中，文章内容区独立滚动。阅读进度、目录定位和回顶均以该内容区为滚动事件源。
- 顶栏是固定导航；桌面侧栏保留用户的收起状态，低于 1280px 不提供侧栏。窄屏导航由 JS 移至 body，使用与搜索相同的模态焦点隔离、Escape 关闭和焦点恢复机制，避免页眉滤镜限制全屏范围。
- 首页和文章共用内容舞台宽度，正文填满卡片内部；标题、元信息、摘要、标签和正文使用固定的字号、间距与弱文字层级。
- 标题使用本地中文衬线优先字体栈，正文使用系统中文无衬线优先字体栈；代码、路径和技术性元信息使用 `JetBrainsMono Nerd Font`、`CaskaydiaCove Nerd Font` 到 `ui-monospace` 的等宽回退栈。Nerd Font 不用于中文正文或标题，也不作为主题内置或在线加载资源。
- 卡片统一为中等圆角、细边框和有限的阴影。页面级表面承载内容，小交互元素使用 chip 或按钮，不再让每一个区块都叠加相同玻璃效果。
- 正文字号保持用户可配，行高提升到阅读优先的约 `1.75`；图片自适应，表格和代码块在窄宽度下可横向滚动且保留可见边界。
- 页脚按“统计、版权、社区记录、法定备案”的顺序承载辅助信息；空间不足时社区记录按配置顺序优先折叠，工信部与公安备案最后保留。公安备案与社区记录图标共用 `16×16px` 的 `footer-right-record-icon`，避免单项样式漂移。
- 首页、文章、归档、分类、标签、搜索、加密、404、重定向与静态页面共享标题区、表面、空状态和分页规则；代码高亮另有昼夜对比度令牌，不能由外部高亮主题单独决定整体风格。

### 宽度、视口高度与输入能力

响应式判断不能把“页面窄”与“浏览器高度短”混为一谈。

| 维度 | 规则 | 目的 |
|------|------|------|
| 宽度 >= 1280px | 完整侧栏、双栏留白与桌面导航 | 利用足够横向空间，不挤压正文 |
| 768px–1279px | 不提供侧栏，保留横向桌面导航 | 侧栏与顶栏独立适配，利用剩余横向空间 |
| 宽度 < 768px | 不提供侧栏，标题居中、全屏纵向菜单、单列正文 | 解决手机横向空间不足 |
| 高度 < 700px | 仅压缩顶栏、页脚和非核心辅助信息 | 适配低高度窗口，不误切换手机布局 |
| `pointer: coarse` | 增大点击目标、禁用 hover 依赖 | 适配触摸设备，而非仅依据宽度猜测 |

主布局 shell、移动导航和搜索对话框等需要满屏的交互容器使用 `100dvh`；文章内容区以 `flex: 1` 与 `min-height: 0` 承接连续滚动，不以固定内容高度截断文章。安全区使用 `env(safe-area-inset-*)`，避免刘海屏和底部手势区遮挡操作。

### 可访问性与动效

- 所有触发行为使用 `button`；导航使用链接。菜单、侧栏和搜索提供准确的 `aria-expanded`、`aria-controls`、焦点转移与 Escape 关闭行为。
- 统一 `:focus-visible` 焦点环，颜色对比度满足正文、弱文字、链接、边框和当前状态的可辨识性；不能只依赖颜色或 hover 表示状态。
- 交互目标最小尺寸为 `44px`；键盘顺序与视觉顺序一致。
- 动效限定为短时反馈。`prefers-reduced-motion` 下移除平移、旋转、闪烁和持续 Canvas 动画，不影响功能可用性。

### 验收范围

使用 Hexo CLI 全量构建后，至少在 320×568、390×844、768×1024、1024×700、1440×900 和 3840×2160 视口检查首页、长文、含目录文章、归档、标签/分类、搜索、404、加密与重定向页面。分别验证 `night`、`day`、`system`，以及键盘导航、触摸菜单、短高度窗口、减少动效、长代码、宽表格与长标题。构建日志不得包含资源渲染错误；仅退出码为零不足以证明成功。

### 共享交互实现

尺寸相关更新统一通过 `source/js/utils/layoutObserver.js` 的 `observeLayout(elements, update, options)` 订阅。工具共用一个 `ResizeObserver` 和窗口 resize 监听，按订阅在 `requestAnimationFrame` 中合并重复通知；它不包含页面选择器，不发送全站布局刷新事件，也不调用其他组件。`request()` 允许滚动等已有事件进入同一调度队列，`disconnect()` 释放订阅；最后一个订阅解除时释放底层监听。没有 `ResizeObserver` 的环境仅退回窗口变化通知，不保证容器独立变化的实时更新。

| 消费者 | 观察的尺寸来源 |
| --- | --- |
| Hero / 404 Canvas | 各自父容器及视口变化；尺寸和 DPR 未改变时不重设画布 |
| 顶栏收缩 | 顶栏、左侧导航、中央区域与视口，不与菜单点击处理器互调 |
| 阅读进度 / 目录 / 回顶状态 | 内容滚动区域、正文内容尺寸及视口；scroll 复用同一帧调度 |
| 回顶按钮的页脚偏移 | 页脚尺寸 |
| 星空背景 | 仅视口变化，不因正文或侧栏变化重建星空 |

浏览器回归由 `tests/ui-regression.cjs` 调用 `tests/layout-observation.cjs`，验证不调整窗口时侧栏开合后的 Canvas 尺寸、长标题导航收缩恢复、正文异步增高及视口高度变化后的阅读进度，并验证调度去重、订阅隔离和解除订阅。

文章 AI 声明使用独立 helper 统一规范化 Front Matter，顶部和文末读取同一结果。顶部复用元数据控件，以原生锚点连接文末；文末复用文章信息行和边框令牌，不新增卡片、厂商配色或事件脚本。UI 标签跟随站点语言，作者填写的内容保持原文；没有声明不推断为纯人工创作。

`node tests/ui-regression.cjs` 使用独立临时站点调用 Hexo CLI 构建，并启动本地 Chromium 做布局和交互断言；需要可执行的 `chromium`（或 `CHROMIUM` 路径）及宿主 `node_modules`。测试阻断远程请求，不读取私人配置；评论服务的登录、发布和服务端响应不在该测试范围。

- `control-surface()` 提供统一按钮表面和扫光反馈，`action-control()` 提供实心操作，`form-field()` 提供输入框颜色与焦点样式。组件只补充尺寸、排列与必要图标，避免重复定义同一按钮。
- Twikoo 的 Element UI 生成结构由评论适配层接入以上 Mixin：普通按钮与主操作共用尺寸，组合输入框保留拼接结构，窄屏操作行可换行。移动端隐藏输入区头像，为表单保留宽度，但保留评论列表头像；空预览容器不显示边框。不只覆盖发送按钮，也不改变第三方事件绑定。
- 日间强调色由配置色加深得到，实心按钮的文字与背景成对设置；高亮语法使用 `--dt-code-*` 令牌，显式日间与系统日间复用同一套调色板。
- `utils/content.js` 统一初始正文与解密正文的复制/高亮初始化；复制事件幂等绑定。赞赏事件位于 `features/sponsor.js`，Pug 仅声明按钮和隐藏面板。
- Hero 和 404 共用 `canvasMotion.js` 管理减少动效和后台暂停；星空保持既有实现与视觉流向。
- 社区记录按实际配置数量生成容器查询，第 n 项阈值为 `63 + 11 × (n - 1) rem`，从末项开始收起，不再只处理前两项。

### CSS 导入顺序（main.styl）

```
1. _function/*     — 功能函数
2. _variable/*     — 令牌和布局变量
3. _animation/*    — 动画关键帧
4. _mixins/*       — 复用样式
5. _layout/*       — 页面与组件样式
6. highlight/*     — 代码高亮覆盖
```

---

## 4. JavaScript 模块系统

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
| `dialog.js` | `export { named }` | 共用模态交互与背景隔离 |
| `codeCopy.js` | `export { named }` | 1 个函数 |
| `PageVisibility.js` | `export { named }` | 1 个函数 |
| `localSearch.js` | `export { named }` | 本地搜索初始化 |

### 加载方式

- **main.js**：通过 injector 注入为 `<script type="module">`（body 结束前）
- **localSearch.js**：通过 header.pug 的 `<script>` 标签直接加载
- **algolia 相关**：通过 CDN `<script>` 标签加载

---

## 5. Pug 模板结构

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

## 6. Scripts 架构（构建时逻辑）

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
| `cdn-image.js` | after_post_render | 按 manifest 将正文图片改写为 CDN URL |
| `encrypt.js` | after_post_render | 自建文章加密；在图片 URL 改写之后运行 |

### Injectors（资源注入器）

| 文件 | 功能 |
|------|------|
| `injector-resource.js` | CSS/JS 资源注入 |
| `injector-comments.js` | 评论系统脚本 |
| `injector-search.js` | 搜索配置注入 |
| `injector-config.js` | 主题配置注入 |
| `injector-cdn-image-fallback.js` | 可选的 CDN 图片本地回退监听器 |

### Console（命令）

| 命令 | 功能 | 外部依赖 |
|------|------|----------|
| `hexo algolia` | 管理 Algolia 索引；支持清理与 dry-run | 宿主项目的 `algoliasearch` SDK |
| `hexo cdn sync/check/prune` | 扫描正文图片、维护站点侧 manifest、检查或安全清理对象 | 无 SDK；七牛通过 HTTP API 调用 |
| `hexo themeinit` | 初始化主题用户覆盖配置 | 无 |

### 功能整合边界

搜索、Sitemap、文章加密与正文图片 CDN 都由主题注册的 Hexo generator、filter、injector 或 console 命令实现，不依赖同名第三方 Hexo 插件。Algolia 索引管理是唯一需要宿主显式安装 SDK 的功能；主题不修改宿主的依赖、忽略规则或提交策略。

---

## 7. 配置体系

### 配置优先级

```
1. 主题 _config.yml (默认值)
2. _config.hexo-theme-doratiger.yml (用户覆盖)
3. 文章 front-matter (单篇覆盖)
```

### 生命周期与配置可见性

`scripts/index.js` 是 Hexo 构建期脚本的唯一入口；各目录仍按职责拆分。主题在 `ready` 阶段先读取主题默认配置与根目录 `_config.hexo-theme-doratiger.yml`，将合并结果保存到 `hexo.doratiger.config`。这样，依赖主题变量的构建期逻辑不必等待模板渲染。

在 `generateBefore` 阶段，主题会再次合并已由 Hexo 处理完的历史 `source/_data/doratiger_config.yml`，再将结果发布到 `theme.config`，并在此后注册 injector。模板、生成器和资源注入器因此消费同一份最终配置；历史配置兼容逻辑不能仅依赖 Hexo 的自动主题配置合并替代。

### 正文图片 CDN 生命周期

`hexo cdn sync` 仅以 Hexo 的文章与资源模型扫描正文图片，计算对象键并把同步状态写入 `<Hexo 根目录>/plugins/cdn_image/.hexo-cdn-image-manifest.json`。正常 `hexo generate` 的 `after_post_render` filter 再依据 manifest 改写已匹配的正文图片 URL；它不读取 `public/`，也不改写 Markdown 源文件。

`hexo cdn check` 离线校验 manifest 与当前文章资源，`hexo cdn prune` 默认只预览当前 manifest 已不再引用的对象；删除必须同时给出 `--apply --yes`。启用 `cdn_image.fallback.enable` 时，生成 HTML 为 CDN 图片保留本地候选路径，并注入一次性浏览器端回退监听器。manifest 属于宿主站点数据，主题只约定默认路径，不控制其 Git 策略。

### 内部 URL 约定

主题内的站内路径（模板、默认资源与本地资源清单）必须通过 Hexo `url_for` 解析，逻辑路径可写成 `/images/avatar.png` 或 `/archives`。这样站点 `root` 为 `/` 与子路径（如 `/blog/`）时都会生成正确地址。完整 HTTP(S)、`mailto:` 等外部地址保持原值，不应手动拼接站点根路径。

### 关键配置路径

```
theme.style.*           → 外观选择、设计令牌覆盖和布局尺度
theme.sidebar.*         → 侧边栏配置
theme.header.*          → 导航栏配置
theme.post.*            → 文章页配置
theme.search.*          → 搜索配置
theme.statistics.*      → 统计配置
theme.encrypt.*         → 加密配置
theme.sitemap.*         → Sitemap 配置
theme.cdn_image.*       → 正文图片 CDN 配置
```

---

## 8. 关键约束（修改时必须遵守）

1. **模板与样式命名必须对齐**：Pug 的 class/id 变更需同步到 Stylus 与 JS 选择器。
2. **JS 模块导出风格保持稳定**：默认导出与具名导出不要随意变更，避免入口调用失配。
3. **入口初始化顺序应保持可预期**：`main.js` 中初始化函数尽量保持“布局 -> 交互 -> 功能”顺序。
4. **组件只消费语义设计令牌**：Stylus 负责生成令牌；组件不得直接写入页面颜色、阴影或组件专属调色板。
5. **修改构建期过滤器后建议全量重建**：执行 `npx hexo clean && npx hexo generate`，防止 db 缓存导致产物未更新。

---

## 9. 已知问题

- 视觉系统重构前，`Canvas` 星空没有统一的性能降级、可见性暂停或减少动效处理。
- 视觉系统重构前，页面依赖固定视口高度和内部滚动；窄屏与短高度窗口的处理未区分。
- 主题保留了部分第三方生成结构和历史 ID/class 选择器以维持兼容，不能只根据命名一致性做机械重构。
- 主题缺少覆盖全部配置组合的自动化浏览器测试；涉及响应式、搜索、加密、评论或本地/CDN 资源切换时仍需人工页面验证。

---

## 10. JavaScript 开发规范

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

## 11. 验证矩阵

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
| 正文图片 CDN | `hexo cdn check`、重复 `hexo cdn sync` 不重复上传、全量构建后的 CDN URL 与本地回退；涉及远端对象时再验证实际 HTTP 响应 |
| 配置 / i18n | 默认配置、用户覆盖配置、`zh-Hans` 与 `en` 关键页面 |
| 资源加载 | 本地资源模式；涉及 CDN 时再检查 CDN 覆盖模式 |
| 生命周期 / 站内路径 | 使用最小站点分别验证 `root: /` 与子路径 `root: /blog/`；确认 CSS、JS、头像/SEO、导航、404 与重定向地址 |

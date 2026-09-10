# Changelog

## Unreleased

- 新增独立 canonical 配置和文章级覆盖，联动文章 JSON-LD、sitemap XML/TXT 与 robots；跨域镜像不重复推荐非规范页面，robots 不再声明未生成的站点地图。导航、搜索、评论保留当前站点域名；结构化数据改为安全 JSON 序列化。

- Algolia 记录 ID 改为文章相对源路径的稳定摘要，避免隔离构建配合 `--clean false` 重复添加文章；升级后需完整重建索引一次。

- Algolia 新增 `--target` 目标配置支持，隔离构建最新文章再生成索引，支持 dry-run；环境索引与目标显式索引冲突时报错，防止多目标误写共享索引。

- 新增目标级 `publish.pages`：显式生成 `.nojekyll` 与可选 `CNAME`，检查源文件/生成器域名冲突，纳入产物校验；保留 `multi-*` 命令名并在 CLI 帮助中标识 DoraTiger，不修改远程 Pages 设置。

- multi 发布失败时支持 `--debug` 输出白名单化的 Git 操作、退出码、耗时及错误分类，不输出原始 stderr；未安装 Git 或 PATH 不可见时提供独立的中英繁安装提示。

- 修复多目标输入快照误排除内容目录中的 `public/` 与 `db.json`；静态文件沿用 Hexo 的 `skip_render`、`include`、`exclude` / `ignore`，保留敏感文件和运行目录隔离。

- 新增 `multi-server <目标>` 开发预览及 `--static` 已校验产物预览：共用目标配置，隔离 Hexo CLI 运行，源文件与配置变化重启，默认本机监听，不改变发布记录和最新产物。
- Twikoo 普通/主操作、组合输入框与窄屏操作行复用主题样式，统一预览与发送按钮尺寸及日夜色彩。

- 统一容器尺寸观察与逐帧调度，修复侧栏开合后 Hero/404 Canvas 尺寸滞后、导航收起后标题/时间不恢复，以及正文或视口高度变化后阅读进度不更新；复用到页脚偏移与背景，避免组件间补发 resize 事件。

- 新增默认关闭的多目标构建与 Git 发布命令：单个目标文件包含 site/theme 差异，隔离调用 Hexo CLI，校验产物并保留 Git 历史；相同产物重复推送不新增提交。公共 theme_config 与目标主题覆盖在提前合并阶段统一生效。
- 多目标 Git 发布支持目标级提交信息、作者和邮箱、HTTPS 环境变量令牌认证；`multi-push --force` 显式允许接管目标分支和强制推送，仍校验产物。
- 新增 `multi-history` 本地发布记录查询与 `multi-clean` 运行数据清理：自动记录发布结果及未确认状态，清理默认预览、显式确认删除，按目标保留历史并保护最新产物和共享输入；不增加远程状态监控。

- 新增可选文章级 AI 辅助声明：Front Matter `ai.tools/usage/note`，顶部元数据锚点与文末完整说明，支持简中、繁中、英文，无额外依赖。

- 共享按钮扫光仅在进入时播放，避免移出反向扫光造成闪烁；搜索分页与站点分页共用控件、间距及窄屏换行样式。

- 修复 Stylus 循环变量污染及侧栏无效过渡；按钮、输入框和日间高亮复用共享样式与配色令牌。
- 移动导航复用搜索的全屏模态交互；修复侧栏缩放状态重置、搜索索引加载后不刷新和解密正文未初始化复制/高亮的问题。
- 修复加密、赞赏、Gitment 窄屏布局和 Valine 提交按钮样式；社区记录折叠覆盖全部配置项。
- 复制、赞赏、返回顶部使用语义化按钮；Hero 换行不再重叠，Hero/404 支持减少动效与后台暂停。

- 新增可选的七牛正文图片 CDN：`hexo cdn sync/check/prune`、主站侧 manifest 与构建期 URL 改写。
- 可选 CDN 加载失败回退到随站点发布的本地正文图片。
- 新增 `footer.community_records`：以扁平页脚链接接入社区/娱乐性质记录；支持按配置顺序折叠、可选图标，以及本地逻辑路径和 HTTPS 图标 URL。
- 公安备案与社区记录图标统一为 `16×16px` 的共享呈现组件。

## 2026-09-05

### Changed
- 新增 `scripts/index.js` 作为 Hexo 构建期脚本入口；各功能目录保持独立注册。
- 配置合并改为在 `ready` 形成统一快照、在 `generateBefore` 发布并注册资源注入器，确保注入脚本可读取最终主题配置。

### Fixed
- 修复 CSS/JS injector 未被 Hexo 加载，以及子路径部署时本地资源、导航、头像、404、隐私页和外链重定向地址丢失 `root` 前缀的问题。
- 修复默认 Open Graph 图片、首页文章标题链接、Algolia 配置回退与 Stylus 未定义颜色变量。

## 2026-03-30

### Added
- 侧边 TOC 前导符号支持配置项 `sidebar.toc.prefix`（默认 `>>`）

### Changed
- 侧边 TOC 导航视觉优化：增加条目间距、悬停位移、激活态强调与层级缩进
- TOC 前导符号改为通过 `source/css/_variable/variable.styl` 统一注入

### Fixed
- 修复 TOC 前导符号不生效问题：`content` 编译值缺少引号导致浏览器忽略
- 同步补全配置与文档示例（`_config.yml` / `docs/CONFIG.md`）

## 2026-03-29

### Added
- 新增文章赞赏能力（支付宝/微信二维码）与默认示例资源
- 新增 `hexo themeinit` 初始化命令（支持 `--force` / `--legacy`）
- 新增文章预计阅读时间显示（字数 + 分钟）

### Changed
- 配置文档 `docs/CONFIG.md` 结构化重写，统一章节格式与说明风格
- 主题配置 `_config.yml` 按文档顺序重排，并补全中英文注释
- 侧边栏字段语义对齐：统一使用 `sidebar.info.description`
- 样式配置项对齐：补齐“声明未实现 / 实现未声明”差异
- 二维码与复制相关脚本、布局与样式进行稳健性重构和统一命名

### Fixed
- 修复代码复制提示属性与复制回退逻辑
- 修复二维码提示展示与冗余配置问题
- 修复 redirect 配置仅 `exclude` 生效的问题，完善 `method/include/exclude` 实际行为

## 2026-03-28

### Added
- sitemap.xml/sitemap.txt 主题自动生成（替代 hexo-generator-sitemap），支持 `format: xml|txt|both`
- sitemap 支持 front-matter `sitemap: false` 排除文章
- robots.txt 主题自动生成，`disallow` 路径可配置
- 服务条款页面（`/terms`），配置驱动，版权自动关联 `post.copyright.license`
- 隐私政策页面（`/privacy`），配置驱动
- 外链重定向拦截：点击时跳转确认页面，保持原始 `href` 不变
- 自建 `counter` 统计方案（支持 API 和 localStorage 两种模式）
- 自建文章加密功能（替代 hexo-blog-encrypt），AES-256-GCM + PBKDF2
- 加密文章 front-matter 支持自定义 `abstract` / `message`
- 加密文章首页摘要替换为加密提示
- 本地搜索原生实现（替代 hexo-generator-searchdb），支持 front-matter `search: false`
- 文章置顶样式（`sticky: 100`）
- 导航栏服务条款、隐私政策菜单项
- 404 页面自动倒计时跳转首页（`redirect_delay` 配置）
- i18n 多语言支持（zh-Hans / zh-Hant / en）
- 配置文档 `docs/CONFIG.md`
- 更新日志 `docs/CHANGELOG.md`
- 英文 README / CONTRIBUTING
- CI：Gitea→GitHub 自动同步工作流

### Changed
- 配置项拼写修正（BREAKING）：`exlude` → `exclude`、`border_botton` → `border_bottom`、`thirdpary` → `thirdparty`
- 修正 themeConfig.js 中配置文件名 typo

### Fixed
- busuanzi 模板变量名错误（`cdn_js` → `cdn`）
- 重定向 `include` 逻辑错误导致外链全部不拦截
- `mailto:` 链接被误拦截
- 重定向链接出现重复 `class` 属性
- `footer.pug` 中 `undefine` 修正为 `undefined`

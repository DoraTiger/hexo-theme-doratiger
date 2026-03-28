# Changelog

## 2026-03-28

### BREAKING
- `redirect.exlude` 重命名为 `redirect.exclude`
- `style.main.border_botton` 重命名为 `style.main.border_bottom`
- `thirdpary` 重命名为 `thirdparty`

### Fixed
- `footer.pug` 中 `undefine` 修正为 `undefined`

### Added
- `robots.txt` 主题自动生成，`disallow` 路径可配置
- 服务条款页面（`/terms`），配置驱动，版权自动关联 `post.copyright.license`
- 隐私政策页面（`/privacy`），配置驱动
- 外链重定向拦截：点击时跳转确认页面，保持原始 `href` 不变
- 自建 `counter` 统计方案（支持 API 和 localStorage 两种模式）
- 导航栏新增服务条款、隐私政策菜单项
- 404 页面自动倒计时跳转首页（`redirect_delay` 配置）
- 404 页面样式
- i18n 多语言支持（zh-Hans / zh-Hant / en）
- 配置文档 `docs/CONFIG.md`

### Changed
- 重定向过滤器使用 `data-redirect` 属性，不修改原始链接

### Fixed
- busuanzi 模板变量名错误（`cdn_js` → `cdn`）
- 重定向 `include` 逻辑错误导致外链全部不拦截
- `mailto:` 链接被误拦截
- 重定向链接出现重复 `class` 属性

### CI
- Gitea→GitHub 自动同步工作流（SSH + Variable 代理）
- hexo 发布工作流改用本地 actions 镜像

## 2026-03-26

### Added
- Algolia 搜索集成，适配 V5 API
- 独立主题配置文件支持（`_config.<theme>.yml`）

### Changed
- 配置合并流程迁移至 `ready` 事件阶段

## 2025-09-20

### Added
- 背景 Canvas 动画
- i18n 多语言支持（zh-Hans / zh-Hant / en）
- 关于页面生成器
- 代码高亮（highlight.js）

### Fixed
- 分类页面链接错误
- 侧边栏 TOC 激活样式不生效

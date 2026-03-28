# Changelog

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

# Changelog

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

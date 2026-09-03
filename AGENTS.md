# AGENTS.md — Hexo Theme DoraTiger

本仓库是独立发布的 Hexo 主题。作为博客的 Git submodule 使用时，同时遵守宿主仓库和工作区规约；发生冲突时，以更严格的安全与验证要求为准。

## 修改前

1. 阅读 `README.md`、`docs/DESIGN.md`、`docs/CONFIG.md` 和相关代码。
2. 检查主题仓库自身的 `git status --short`，不要在宿主仓库状态中遗漏 submodule 内部修改。
3. 明确变更属于模板、样式、浏览器脚本、Hexo 构建脚本、配置或文档，并检查相邻层的耦合关系。

## 架构边界

- `layout/`：Pug 页面与组件。
- `source/css/`：Stylus 变量、Mixin 和布局样式。
- `source/js/`：浏览器端 ES Modules。
- `scripts/`：Hexo / Node.js 构建期 CommonJS。
- `languages/`：用户可见文本的本地化资源。
- `_config.yml` 与 `docs/CONFIG.md`：默认配置及其公开契约。

修改 Pug class/id 时同步检查 Stylus 和 JS 选择器。新增复杂浏览器逻辑应进入 `source/js/`，不要继续堆入 Pug 内联脚本。配置项新增、删除、重命名或默认值变化时，同步更新配置文档、中英文注释和 CHANGELOG。

## 兼容与公开发布

- 不机械重构第三方生成结构或历史兼容选择器。
- 不在代码、示例、日志或文档中写入私人 Gitea 地址、内网域名、凭据和部署信息。
- README、配置文档、贡献指南和许可证链接必须适用于公开 GitHub 镜像，不依赖私有基础设施。
- 中英文文档涉及同一行为时必须同步；无法在同一变更中完整翻译时，先保持事实一致，再优化表达。

## 验证

- 主题依赖宿主 Hexo 项目构建；在宿主根目录执行 `npm run clean && npm run build`。
- 根据 `docs/DESIGN.md` 的验证矩阵检查受影响页面和配置组合。
- 文档修改需检查相对链接、标题层级、中英文一致性和配置键名。
- 未经用户明确要求，不创建提交、标签、发布或 Pull Request；未经当前任务明确授权，禁止任何 `git push`。

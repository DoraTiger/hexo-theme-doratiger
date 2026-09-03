# 贡献指南

[简体中文](./CONTRIBUTING.md) | [English](./CONTRIBUTING_en.md)

感谢你关注 Hexo Theme DoraTiger。提交问题或代码前，请先阅读[设计文档](./DESIGN.md)和[配置文档](./CONFIG.md)。

## 报告问题

问题报告应尽量包含：

- Hexo、Node.js、主题版本或主题提交号
- 操作系统、浏览器及设备类型
- 可以复现问题的最小配置和步骤
- 预期行为与实际行为
- 浏览器控制台或 Hexo 构建日志中的相关错误
- 必要的页面截图；提交前移除令牌、内网地址、用户目录和其他敏感信息

请先确认问题来自主题，而不是文章 Markdown、宿主站点脚本或第三方服务。公开 Issue 中不要粘贴私有仓库地址、API Key、评论系统密钥或部署凭据。

## 建议功能

功能建议应说明使用场景、预期行为、替代方案和兼容影响。主题倾向于配置驱动和一体化能力，但不会仅为“可能有用”增加新的长期维护面。

涉及配置、页面结构或公开行为的提案，应同时考虑：

- 默认配置是否保持向后兼容
- 本地资源和 CDN 模式是否都能工作
- `zh-Hans`、`zh-Hant`、`en` 是否需要新增文案
- 桌面端和窄屏是否具备合理降级
- 是否会与搜索、加密、评论或统计功能互相影响

## 贡献代码

1. 从公开仓库创建分支或 Fork。
2. 只修改实现该功能或修复所需的文件。
3. 同步更新相关配置、文档、语言文件和 CHANGELOG。
4. 在宿主 Hexo 项目中完成全量构建和对应页面验证。
5. 提交 Pull Request，说明设计取舍、验证结果和已知限制。

## 代码规范

项目以仓库现有实现和 `.editorconfig` 为准，不使用与技术栈无关的通用风格指南覆盖现有约定。

- JavaScript 使用 4 空格缩进；Pug、Stylus、YAML 使用 2 空格缩进。
- `source/js/` 是浏览器端 ES Modules，使用 `import` / `export`。
- `scripts/` 是 Hexo 构建期 CommonJS，使用 `require` / `module.exports`。
- 新代码优先使用 `const` / `let`；复杂浏览器逻辑不要写入 Pug 内联脚本。
- Pug 的 class/id、Stylus 选择器和 JavaScript 查询选择器必须同步。
- 样式优先使用 Stylus 变量和已有 Mixin，不引入未定义的 CSS 自定义属性。
- 用户可见文本进入 `languages/*.yml`，避免新增硬编码中文或英文。

更完整的约束见[设计文档](./DESIGN.md)。

## 文档与配置同步

| 变更 | 同步文件 |
|------|----------|
| 配置项或默认值 | `_config.yml`、`docs/CONFIG.md` |
| 用户可见文本 | `languages/zh-Hans.yml`、`zh-Hant.yml`、`en.yml` |
| 架构或开发约束 | `docs/DESIGN.md`，必要时更新 `AGENTS.md` |
| 用户使用方式 | `README.md`、`README_en.md` |
| 功能与修复 | `docs/CHANGELOG.md` |

## 验证

主题没有独立的宿主依赖清单，应在一个启用本主题的 Hexo 项目根目录执行：

```bash
npm run clean
npm run build
```

不要使用旧的 `db.json` 或 `public/` 产物代替全量构建。页面验证范围参见[设计文档中的验证矩阵](./DESIGN.md#10-验证矩阵)。

## Commit Message

```text
<type>(<scope>): <subject>

<body>
```

常用类型包括 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`chore`、`ci` 和 `revert`。标题使用祈使语气，简洁描述行为变化；正文说明原因、兼容影响和验证方式。

CHANGELOG 按日期记录。一次完成的用户可见变更应在同一组修改中更新 CHANGELOG；跨多个提交完成时，在最终提交中汇总实际行为，不复制中间实现细节。

## 文案与许可

中文文档参考[中文文案排版指北](https://github.com/sparanoid/chinese-copywriting-guidelines)。提交贡献即表示你同意相关内容按本项目的 [MIT License](../LICENSE) 发布。

如需帮助，请通过公开仓库的 Issue 或 Pull Request 讨论，并提供不包含敏感信息的最小复现材料。

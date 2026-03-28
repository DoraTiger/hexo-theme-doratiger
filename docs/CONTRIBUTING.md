# 贡献指南

[简体中文](./CONTRIBUTING.md) | [English](./CONTRIBUTING_en.md)

## 如何贡献

#### 报告问题

#### 建议功能

#### 贡献代码

## 代码规范

本项目的代码格式遵循 [Google Style](https://google.github.io/styleguide/pyguide.html)，请确保您的贡献符合该指南。

#### Commit Message 格式

```text
<type>: <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

`type` 有以下几种变更类型：

-   feat：新增功能。
-   fix：修复 Bug。
-   docs：文档更新。
-   style：代码样式调整（如格式化、空格等，不涉及逻辑变更）。
-   refactor：代码重构（不涉及功能变更）。
-   perf：性能优化。
-   test：增加或修改测试用例。
-   chore：修改编译流程，或变更依赖库和工具等。
-   ci：持续集成配置变更。
-   revert：版本回滚。

`subject` 要求如下：

-   简洁的标题，描述本次提交的概要。
-   使用祈使句、现在时态*（例如 "fix bug" 而不是 "Fixed bug"）*。
-   首字母小写，结尾不加句号。
-   长度不超过 50 个字符。

`body` 要求如下：

-   描述本次提交的详细内容和背景。
-   解释为什么要做这些更改，而不是只描述做了什么。
-   每行不超过 72 个字符。
-   除 docs 之外的变更类型必须包含 body。

#### Changelog 规则

Changelog 采用日期记录，不使用版本号。

-   一次能完成的功能 → commit 内包含 changelog 更新。
-   分多次完成的功能 → 子 commit body 中添加 `Changelog: <描述>` 标记，最后用 `docs: 更新 changelog` 汇总。
-   `docs` commit 中引用涉及的 commit hash。

示例：

```text
# 子 commit（标记待写入 changelog）
feat: 重定向 JS 拦截逻辑

Changelog: 外链重定向拦截功能

# 子 commit（标记待写入 changelog）
fix: mailto 链接被误拦截

Changelog: 修复 mailto 被外链拦截

# 汇总 commit
docs: 更新 changelog

汇总 830d88a..577736e 的变更：
- 外链重定向拦截功能
- 修复 mailto 误拦截
```

```text
# 一次完成的功能（changelog 写在同一 commit）
feat: 404 页面添加自动倒计时跳转首页

Changelog: 404 页面自动倒计时跳转首页（redirect_delay 配置生效）
```

`footer` 要求如下（可选）：

-   关联的 issue 或 pull request 编号。

## 命名规范

本项目的中文文档格式遵循 [中文文案排版指北](https://github.com/sparanoid/chinese-copywriting-guidelines)，请确保您的贡献符合该指南。

## 许可

在为本项目做出贡献时，您同意您的贡献遵循本项目的 [许可证](../LICENSE.md)。

## 获取帮助

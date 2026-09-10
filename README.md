[简体中文](./README.md) | [English](./README_en.md)

## 快速开始

#### 1. 搭建 Hexo 博客

如果你还没有 Hexo 博客，请按照 [Hexo 官方文档](https://hexo.io/zh-cn/docs/) 进行安装、建站。

#### 2. 获取主题最新版本

**方式一：源码安装**

克隆 [项目源码](https://github.com/doratiger/hexo-theme-doratiger) 到主题目录。

```bash
git clone https://github.com/doratiger/hexo-theme-doratiger.git themes/hexo-theme-doratiger
```

如果采用 `git` 管理博客，可以使用 `submodule` 安装主题。

```bash
# 添加子模块
git submodule add https://github.com/doratiger/hexo-theme-doratiger.git themes/hexo-theme-doratiger

# 初始化子模块
git submodule update --init --recursive
```

#### 3. 配置渲染依赖

博客网页由 `pug` 构建，需要添加渲染引擎 `hexo-renderer-pug` 到博客依赖中。

```bash
npm i hexo-renderer-pug --registry https://registry.npmmirror.com/
```

#### 4. 指定主题

如下修改 Hexo 博客目录中的 `_config.yml`:

```yaml
theme: hexo-theme-doratiger # 指定主题

language: zh-CN # 指定语言
```

执行主题初始化命令，自动生成主题配置文件：

```bash
hexo themeinit
```

默认会生成博客根目录配置文件 `_config.hexo-theme-doratiger.yml`。

如需同时生成旧版兼容配置（`source/_data/doratiger_config.yml`），可使用：

```bash
hexo themeinit --legacy
```

#### 5. 创建「关于页」

首次使用主题的「关于页」需要手动创建：

```bash
hexo new page about
```

创建成功后，编辑博客目录下 `/source/about/index.md`，添加 `layout` 属性，移除 `data` 属性，修改完成后内容如下。

```markdown
---
title: about
layout：about
---

关于页正文内容。
```

## 更新主题

Algolia 索引 ID 已改为稳定的文章源路径摘要。升级后请完整重建索引一次，以移除旧 ID；随后重复 `--clean false` 不再因临时数据库变化而新增重复记录。源文件移动或删除仍需完整重建。

**方式一：源码更新**

通过 `git` 命令，获取主题最新内容。

```bash
cd themes/hexo-theme-doratiger
git pull
```

如果通过 `submodule` 进行了主题管理，可以通过 `update` 命令更新主题。

```bash
git submodule update --remote
```

## 功能配置

请参考 [功能配置](./docs/CONFIG.md)。

## 主题已经准备好的功能

主题把日常建站里常用的搜索、站点地图、文章加密和图片同步整理为 Hexo 扩展，减少插件之间的拼接成本，让维护者能把更多心思留给内容本身。

| 功能 | 主题如何提供 | 默认状态 | 需要额外准备时 |
| --- | --- | --- | --- |
| Algolia 搜索 | `hexo algolia` 索引管理命令 + 前端搜索组件 | 关闭 | 运行索引管理命令时安装 `algoliasearch` |
| 本地搜索 | `doratiger_local_search` 生成器 + 浏览器端搜索 | 关闭 | 无 |
| Sitemap | `doratiger_sitemap` 生成器，可输出 XML 和 TXT | 开启 | 无 |
| Canonical | 默认自引用，支持首选站点和文章级覆盖，联动 sitemap/robots | 开启 | 无 |
| 文章加密 | 构建期 AES-256-GCM + PBKDF2 过滤器 | 关闭 | 无 |
| 正文图片 CDN | `hexo cdn sync/check/prune` + 构建期 URL 改写 | 关闭 | 无（七牛通过 HTTP API 调用） |
| 多目标构建、预览与发布 | `hexo multi-generate/multi-server/multi-push/multi-deploy`，共用目标配置 | 关闭 | 预览需要 `hexo-server`；Git 发布需要系统 Git 与仓库权限 |

Canonical 独立于 multi：公共主题配置的 `canonical.base_url` 留空时自引用，指定首选站点时映射对应页面；Front Matter `canonical` 支持完整地址或 `false`。文章 JSON-LD 跟随规范地址，访问链接不变。Sitemap 仅推荐自引用页面，没有有效条目时不输出文件，robots 声明与 XML/TXT 实际计划一致。变更后请清理构建与部署中的旧 sitemap，避免重复 canonical 插件；详见[配置说明](docs/CONFIG.md)。

多目标功能在 Hexo 根目录的主题主配置 `_config.hexo-theme-doratiger.yml` 中设置 `multi_deploy`，统一管理目标、子配置路径和全部 `publish` 参数。子配置只通过 `site`、`theme` 覆盖域名、评论等个性化字段，未填写的字段继承公共配置；不要在子配置中配置 `multi_deploy` 或发布参数。

多目标 Git 发布支持按目标设置提交信息、作者与 HTTPS 令牌环境变量引用。默认普通推送；`multi-push --force` 可显式强推并接管分支，可能覆盖远端提交。详见配置文档中的安全说明。

GitHub Pages 可按目标开启 `publish.pages.enable`，在产物中生成 `.nojekyll`；可选 `publish.pages.cname` 生成域名文件。源文件冲突会报错，不修改公共内容或远程 Pages 设置，命令仍使用 `multi-*`。

Algolia 可用 `hexo algolia --target github --dry-run` 检查目标索引；去掉 `--dry-run` 才更新远端。命令重新构建隔离文章数据，不复用公共数据库；目标显式索引与 `ALGOLIA_INDEX_NAME` 冲突时拒绝运行。Sitemap、本地搜索及前端配置自动随目标构建，无需额外命令。

`multi-history` 查看自动保存的本地发布记录；`multi-clean` 按目标保留最近构建和记录，默认只预览，实际删除需要 `--apply --yes`。两者不检查正式网站状态。

Git 发布失败时，可加 `--debug` 查看白名单化的操作名、退出码、耗时和错误分类；不输出原始 Git 错误中的凭据或安全规则放行链接。

`multi-generate` 的分支校验及 Git 发布需要系统 Git；缺失时提示 `MULTI_GIT_MISSING`，请安装并确认 `git --version` 可执行。普通构建、multi 预览、历史查询和清理不因缺少 Git 而受阻。

多目标构建也包含 `source` 中的独立页面与静态文件；原样发布小工具等内容可使用 Hexo 的 `skip_render`，无需新增主题开关。规则可放在公共站点配置或目标的 `site` 下，详见[独立页面与静态文件](./docs/CONFIG.md#独立页面与静态文件)。

`hexo multi-server <目标> --port 4003` 在独立临时目录预览；源文件或配置变化后重启 Hexo，刷新浏览器即可查看。加 `--static` 只预览该目标已生成且通过校验的最新产物，不重建或推送。默认仅监听本机。

需要通过 `hexo algolia` 写入 Algolia 索引时，在**博客根目录**安装 SDK：

```bash
npm install algoliasearch
```

其余功能随主题即可使用。各功能的配置、命令与适用场景见[功能配置](./docs/CONFIG.md)。

## 更新日志

请参考 [更新日志](./docs/CHANGELOG.md)。

## 贡献指南

请参考 [贡献指南](./docs/CONTRIBUTING.md)

## 感谢这些启发过主题的项目

-   [Fan](https://github.com/fan-lv/Fan/)：这是一个深色主题，如梦幻般的星空，群星闪烁。
-   [fluid](https://github.com/fluid-dev/hexo-theme-fluid)：一款 Material Design 风格的主题。
-   [gitment](https://github.com/imsun/gitment)：一款基于 GitHub Issues 的评论系统。
-   [valine](https://github.com/xCss/Valine)：一款快速、简洁且高效的无后端评论系统。
-   [twikoo](https://github.com/twikoojs/twikoo)：一个简洁、安全、免费的静态网站评论系统。
-   [hexo-algolia](https://github.com/thom4parisot/hexo-algolia)：Algolia 索引工作流参考。
-   [hexo-generator-search](https://github.com/wzpan/hexo-generator-search)：本地搜索索引设计参考。
-   [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap)：站点地图生成设计参考。
-   [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt)：文章加密流程设计参考。

## 欢迎赞赏

如果这个主题对你有帮助，欢迎赞赏支持。

| 支付宝 | 微信 |
| --- | --- |
| ![支付宝收款码](./source/images/alipay.jpg) | ![微信收款码](./source/images/wechat.jpg) |

如果你基于本主题搭建博客，请务必在博客根目录的 `_config.hexo-theme-doratiger.yml` 中，将 `post_extend.sponsor.alipay` 和 `post_extend.sponsor.wechat` 替换为你自己的收款码路径。

## 许可

本项目遵循 [MIT](./LICENSE) 开源协议。

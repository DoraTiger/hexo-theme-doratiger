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
| 文章加密 | 构建期 AES-256-GCM + PBKDF2 过滤器 | 关闭 | 无 |
| 正文图片 CDN | `hexo cdn sync/check/prune` + 构建期 URL 改写 | 关闭 | 无（七牛通过 HTTP API 调用） |

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

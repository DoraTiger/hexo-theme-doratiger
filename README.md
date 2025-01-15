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

将主题目录的 `_config.yml` 配置文件，复制到博客根目录中，并重命名为 `_config.hexo-theme-doratiger.yml`。

```bash
cp ./themes/hexo-theme-doratiger/_config.yaml ./_config.hexo-theme-doratiger.yaml
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

## 更新日志

请参考 [更新日志](./docs/CHANGELOG.md)。

## 贡献指南

请参考 [贡献指南](./docs/CONTRIBUTING.md)

## 参考项目

-   [Fan](https://github.com/fan-lv/Fan/)：这是一个深色主题，如梦幻般的星空，群星闪烁。
-   [fluid](https://github.com/fluid-dev/hexo-theme-fluid)：一款 Material Design 风格的主题。
-   [gitment](https://github.com/imsun/gitment)：一款基于 GitHub Issues 的评论系统。
-   [valine](https://github.com/xCss/Valine)：一款快速、简洁且高效的无后端评论系统。
-   [twikoo](https://github.com/twikoojs/twikoo)：一个简洁、安全、免费的静态网站评论系统。
-   [hexo-algolia](https://github.com/thom4parisot/hexo-algolia) hexo-algolia is an hexo plugin provided by the community.
-   [hexo-generator-search](https://github.com/wzpan/hexo-generator-search) This plugin is used for generating a search index file, which contains all the neccessary data of your articles that you can use to write a local search engine for your blog.
-   [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap) Generate sitemap.
-   [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt) ~~这可能是 Hexo 生态圈中**最好的**博客加密插件~~

## 许可

本项目遵循 [MIT](./LICENSE) 开源协议。

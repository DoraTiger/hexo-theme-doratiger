[简体中文](./README.md) | English

# Hexo Theme DoraTiger

A dark theme for Hexo with custom features and simple configuration.

## Quick Start

#### 1. Set Up Hexo

If you don't have a Hexo blog yet, follow the [Hexo official docs](https://hexo.io/docs/) to install and create your site.

#### 2. Get the Theme

**Option A: Clone**

```bash
git clone https://github.com/doratiger/hexo-theme-doratiger.git themes/hexo-theme-doratiger
```

**Option B: Submodule**

```bash
git submodule add https://github.com/doratiger/hexo-theme-doratiger.git themes/hexo-theme-doratiger
git submodule update --init --recursive
```

#### 3. Install Renderer

The theme uses `pug` templates. Install the renderer:

```bash
npm i hexo-renderer-pug
```

#### 4. Configure Theme

Edit `_config.yml` in your Hexo root:

```yaml
theme: hexo-theme-doratiger
language: en
```

Run theme initialization to generate config automatically:

```bash
hexo themeinit
```

By default, it generates `_config.hexo-theme-doratiger.yml` in your site root.

If you also need legacy-compatible config (`source/_data/doratiger_config.yml`), run:

```bash
hexo themeinit --legacy
```

#### 5. Create About Page

```bash
hexo new page about
```

Edit `/source/about/index.md`:

```markdown
---
title: about
layout: about
---

Your about page content.
```

## Update Theme

```bash
cd themes/hexo-theme-doratiger
git pull
```

Or via submodule:

```bash
git submodule update --remote
```

## Configuration

See [Configuration Guide](./docs/CONFIG.md).

## Changelog

See [Changelog](./docs/CHANGELOG.md).

## Contributing

See [Contributing Guide](./docs/CONTRIBUTING_en.md).

## References

-   [Fan](https://github.com/fan-lv/Fan/)：Dark theme with dreamy starry sky effect.
-   [fluid](https://github.com/fluid-dev/hexo-theme-fluid)：Material Design style theme.
-   [gitment](https://github.com/imsun/gitment)：GitHub Issues-based comment system.
-   [valine](https://github.com/xCss/Valine)：Fast, simple, serverless comment system.
-   [twikoo](https://github.com/twikoojs/twikoo)：Simple, secure, free static site comment system.
-   [hexo-algolia](https://github.com/thom4parisot/hexo-algolia)：Algolia search plugin for Hexo.
-   [hexo-generator-search](https://github.com/wzpan/hexo-generator-search)：Local search index generator.
-   [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap)：Sitemap generator.
-   [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt)：Hexo blog encryption plugin (integrated).

## Buy Me a Coffee

If this theme helped you, your support is appreciated.

| Alipay | WeChat |
| --- | --- |
| ![Alipay QR](./source/images/alipay.jpg) | ![WeChat QR](./source/images/wechat.jpg) |

If you use this theme for your own blog, please replace `post_extend.sponsor.alipay` and `post_extend.sponsor.wechat` in your `_config.hexo-theme-doratiger.yml` with your own QR code image paths.

## License

[MIT](./LICENSE)

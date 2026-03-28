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

Copy the theme config to your Hexo root:

```bash
cp ./themes/hexo-theme-doratiger/_config.yml ./_config.hexo-theme-doratiger.yml
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
-   [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt)：Blog encryption plugin.

## License

[MIT](./LICENSE)

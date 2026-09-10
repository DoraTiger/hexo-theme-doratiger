[简体中文](./README.md) | English

# Hexo Theme DoraTiger

A Hexo theme for technical blogs: a starry night by default, with daylight and system-following appearances designed for comfortable long-form reading.

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

## Features Ready in the Theme

The theme gathers everyday blog features—search, sitemaps, post encryption, and image syncing—into Hexo extensions, reducing the work of assembling plugins so maintainers can spend more time on their content.

| Feature | How the theme provides it | Default | Extra setup when needed |
| --- | --- | --- | --- |
| Algolia search | `hexo algolia` index-management command and browser search UI | Off | Install `algoliasearch` when running the index-management command |
| Local search | `doratiger_local_search` generator and browser search | Off | None |
| Sitemap | `doratiger_sitemap` generator for XML and TXT | On | None |
| Post encryption | Build-time AES-256-GCM + PBKDF2 filter | Off | None |
| Post image CDN | `hexo cdn sync/check/prune` and build-time URL rewrite | Off | None (Qiniu is called through its HTTP API) |
| Multi-target builds, previews and publishing | `hexo multi-generate/multi-server/multi-push/multi-deploy`, one shared target profile | Off | `hexo-server` for previews; system Git and repository access for publishing |

Configure `multi_deploy` in the main theme configuration, `_config.hexo-theme-doratiger.yml` at the Hexo root, to manage targets, child configuration paths and all `publish` parameters. Child files contain only `site` and `theme` overrides for differences such as domains and comments; omitted fields inherit the shared configuration. Do not put `multi_deploy` or publishing parameters in child files.

Git publishing supports per-target commit messages, author identity and HTTPS token environment references. Pushes are non-forced by default; `multi-push --force` explicitly permits branch takeover and may overwrite remote commits. See the configuration guide for safety details.

For GitHub Pages, explicitly enable `publish.pages.enable` per target to generate `.nojekyll` in the artifact. Optional `publish.pages.cname` generates the domain file. Conflicting source files are rejected; shared content and remote Pages settings are not modified. Commands retain the `multi-*` names.

Use `hexo algolia --target github --dry-run` to inspect a target index; remove `--dry-run` to update the remote index. The command builds fresh isolated post data instead of using the shared database. A conflicting `ALGOLIA_INDEX_NAME` and explicit target index is rejected. Sitemaps, local search and frontend configuration already follow target builds without extra commands.

`multi-history` reads automatically saved local publication records. `multi-clean` retains recent builds and records per target, previews by default, and requires `--apply --yes` to delete runtime data. Neither command monitors the live website.

For Git publication failures, add `--debug` to show allowlisted operation names, exit codes, elapsed times and error categories. Raw Git diagnostics, credentials and security-rule bypass links are never printed by this diagnostic output.

Branch validation in `multi-generate` and Git publishing require system Git. If unavailable, `MULTI_GIT_MISSING` asks you to install Git and verify `git --version`. Ordinary builds, multi previews, history queries and cleanup do not require Git.

Multi-target builds also include standalone pages and static files from `source`. Use Hexo's `skip_render` to publish tools without rendering them; no extra theme switch is needed. Put these rules in the shared site configuration or the target's `site` section. See [standalone pages and static files](./docs/CONFIG.md#独立页面与静态文件).

`hexo multi-server <target> --port 4003` previews in a private temporary directory. Source or configuration changes restart Hexo; refresh the browser to see updates. Add `--static` to serve only the latest verified artifact without rebuilding or pushing. The default bind address is loopback.

Install the SDK in your **Hexo site root** only when managing an Algolia index with `hexo algolia`:

```bash
npm install algoliasearch
```

The remaining features are ready with the theme. See the [Configuration Guide](./docs/CONFIG.md) for settings, commands, and when each feature is useful.

## Changelog

Algolia object IDs now use a stable hash of each post's source-relative path. Rebuild the index once after upgrading to remove legacy IDs. Repeated `--clean false` updates then retain record identity across fresh databases; moving or deleting source files still requires a full rebuild.

See [Changelog](./docs/CHANGELOG.md).

## Contributing

See [Contributing Guide](./docs/CONTRIBUTING_en.md).

## With Thanks to the Projects That Inspired DoraTiger

-   [Fan](https://github.com/fan-lv/Fan/)：Dark theme with dreamy starry sky effect.
-   [fluid](https://github.com/fluid-dev/hexo-theme-fluid)：Material Design style theme.
-   [gitment](https://github.com/imsun/gitment)：GitHub Issues-based comment system.
-   [valine](https://github.com/xCss/Valine)：Fast, simple, serverless comment system.
-   [twikoo](https://github.com/twikoojs/twikoo)：Simple, secure, free static site comment system.
-   [hexo-algolia](https://github.com/thom4parisot/hexo-algolia)：Reference for the Algolia indexing workflow.
-   [hexo-generator-search](https://github.com/wzpan/hexo-generator-search)：Reference for local-search index design.
-   [hexo-generator-sitemap](https://github.com/hexojs/hexo-generator-sitemap)：Reference for sitemap generation.
-   [hexo-blog-encrypt](https://github.com/D0n9X1n/hexo-blog-encrypt)：Reference for the post-encryption flow.

## Buy Me a Coffee

If this theme helped you, your support is appreciated.

| Alipay | WeChat |
| --- | --- |
| ![Alipay QR](./source/images/alipay.jpg) | ![WeChat QR](./source/images/wechat.jpg) |

If you use this theme for your own blog, please replace `post_extend.sponsor.alipay` and `post_extend.sponsor.wechat` in your `_config.hexo-theme-doratiger.yml` with your own QR code image paths.

## License

[MIT](./LICENSE)

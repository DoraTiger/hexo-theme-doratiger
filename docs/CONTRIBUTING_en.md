# Contributing

[简体中文](./CONTRIBUTING.md) | [English](./CONTRIBUTING_en.md)

Thank you for your interest in Hexo Theme DoraTiger. Read the [design documentation](./DESIGN.md) and [configuration guide](./CONFIG.md) before reporting an issue or submitting code.

## Reporting Issues

Include as much of the following information as possible:

- Hexo, Node.js, and theme versions or the theme commit
- Operating system, browser, and device type
- Minimal configuration and reproduction steps
- Expected and actual behavior
- Relevant browser console or Hexo build errors
- Screenshots when necessary, with tokens, internal addresses, user paths, and other sensitive data removed

Confirm that the issue belongs to the theme rather than article Markdown, host-site scripts, or a third-party service. Never publish private repository URLs, API keys, comment-service secrets, or deployment credentials in an issue.

## Suggesting Features

Describe the use case, expected behavior, alternatives, and compatibility impact. The theme favors configuration-driven, integrated features, but avoids adding a permanent maintenance surface for speculative use cases.

For changes to configuration, page structure, or public behavior, consider:

- Backward compatibility of default configuration
- Both local-resource and CDN modes
- New copy required in `zh-Hans`, `zh-Hant`, and `en`
- Reasonable behavior on desktop and narrow screens
- Interactions with search, encryption, comments, and statistics

## Contributing Code

1. Create a branch or fork from the public repository.
2. Change only the files required for the feature or fix.
3. Update related configuration, documentation, language files, and the changelog.
4. Run a clean build and verify affected pages in a host Hexo project.
5. Open a pull request describing design trade-offs, verification results, and known limitations.

## Code Style

Follow the existing code and `.editorconfig`; do not impose a style guide for an unrelated technology stack.

- Use 4-space indentation for JavaScript and 2 spaces for Pug, Stylus, and YAML.
- `source/js/` contains browser ES Modules and uses `import` / `export`.
- `scripts/` contains Hexo build-time CommonJS and uses `require` / `module.exports`.
- Prefer `const` / `let` in new code. Do not add complex browser logic to inline Pug scripts.
- Keep Pug class/ID names, Stylus selectors, and JavaScript selectors aligned.
- Prefer existing Stylus variables and mixins; do not introduce undefined CSS custom properties.
- Put user-visible copy in `languages/*.yml` instead of hard-coding Chinese or English text.

See the [design documentation](./DESIGN.md) for the complete architectural constraints.

## Documentation and Configuration

| Change | Files to update |
|--------|-----------------|
| Configuration key or default | `_config.yml`, `docs/CONFIG.md` |
| User-visible copy | `languages/zh-Hans.yml`, `zh-Hant.yml`, `en.yml` |
| Architecture or development rule | `docs/DESIGN.md`, and `AGENTS.md` when needed |
| User workflow | `README.md`, `README_en.md` |
| Feature or fix | `docs/CHANGELOG.md` |

## Verification

The theme does not maintain the host project's dependency manifest. From a Hexo project that enables the theme, run:

```bash
npm run clean
npm run build
```

Do not use an old `db.json` or generated `public/` directory as a substitute for a clean build. Use the [verification matrix](./DESIGN.md#10-验证矩阵) to select affected pages and configuration combinations.

For `hexo algolia`, confirm that the host project has `algoliasearch` installed. For `hexo cdn`, cover `check`, idempotent `sync`, and the guarded `prune` flow described in the configuration guide.

## Commit Messages

```text
<type>(<scope>): <subject>

<body>
```

Common types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, and `revert`. Use an imperative subject that describes the behavior change. Explain motivation, compatibility impact, and verification in the body.

The changelog is organized by date. Update it with user-visible behavior, not intermediate implementation details.

## Copy and License

Chinese documentation follows the [Chinese Copywriting Guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.en.md). By contributing, you agree that your contribution is released under the project's [MIT License](../LICENSE).

Ask for help through an issue or pull request in the public repository and provide a minimal reproduction that contains no sensitive information.

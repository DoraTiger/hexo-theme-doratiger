# Contributing

[简体中文](./CONTRIBUTING.md) | [English](./CONTRIBUTING_en.md)

## How to Contribute

#### Report Issues

#### Suggest Features

#### Contribute Code

## Code Style

This project follows [Google Style](https://google.github.io/styleguide/pyguide.html). Please ensure your contribution complies with this guide.

#### Commit Message Format

```text
<type>: <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

`type` — one of the following:

-   feat: New feature.
-   fix: Bug fix.
-   docs: Documentation update.
-   style: Code style changes (formatting, whitespace, no logic changes).
-   refactor: Code refactoring (no feature changes).
-   perf: Performance optimization.
-   test: Add or modify tests.
-   chore: Build process, dependencies, or tooling changes.
-   ci: CI/CD configuration changes.
-   revert: Version rollback.

`subject` requirements:

-   Concise summary of the change.
-   Use imperative mood, present tense *(e.g., "fix bug" not "Fixed bug")*.
-   Lowercase first letter, no period at the end.
-   Max 50 characters.

`body` requirements:

-   Detailed description of the change and context.
-   Explain why, not just what.
-   Max 72 characters per line.
-   Required for all types except `docs`.

#### Changelog Rules

Changelog uses dates instead of version numbers.

-   Features completed in one commit → include changelog update in the same commit.
-   Features spanning multiple commits → add `Changelog: <description>` in sub-commit body, then summarize with `docs: update changelog`.
-   The `docs` commit should reference related commit hashes.

Examples:

```text
# Sub-commit (mark for changelog)
feat: redirect JS interception logic

Changelog: external link redirect interception

# Sub-commit (mark for changelog)
fix: mailto links incorrectly intercepted

Changelog: fix mailto intercepted by redirect filter

# Summary commit
docs: update changelog

Summarize changes from 830d88a..577736e:
- External link redirect interception
- Fix mailto interception
```

```text
# Single-commit feature (changelog included)
feat: add auto-redirect countdown to 404 page

Changelog: 404 page auto-redirect countdown (redirect_delay config)
```

`footer` requirements (optional):

-   Related issue or pull request numbers.

## Naming Conventions

Chinese documentation follows [Chinese Copywriting Guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.en.md). Please ensure your contribution complies with this guide.

## License

By contributing to this project, you agree that your contributions are licensed under the project's [license](../LICENSE.md).

## Getting Help

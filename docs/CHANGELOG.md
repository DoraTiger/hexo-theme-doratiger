# Changelog

## [v1.2.0] - 2026-03-28

### Added
- Theme-generated `robots.txt` with configurable disallow paths
- Terms of Service page (`/terms`), driven by theme config
- Privacy Policy page (`/privacy`), driven by theme config
- External link redirect interceptor with JS click handler (preserves original `href`)
- Self-hosted `counter` statistics as busuanzi alternative (supports API and localStorage modes)
- Navigation menu entries for terms and privacy pages
- i18n translations for terms/privacy in zh-Hans, zh-Hant, en
- CSS styles for redirect page
- Configuration documentation (`docs/CONFIG.md`)

### Changed
- Navigation menu now supports terms and privacy entries (commented by default)
- Redirect filter uses `data-redirect` attribute instead of modifying `href`

### Fixed
- Busuanzi template variable name mismatch (`cdn_js` vs `cdn`)
- Redirect filter include logic was blocking all external links
- `mailto:` links incorrectly intercepted by redirect filter
- Duplicate `class` attributes on redirected links

## [v1.1.0] - 2026-03-26

### Added
- Algolia search integration with V5 API support
- Config merge flow moved to `ready` event for proper dependency resolution

### Changed
- Separate theme config file support (`_config.<theme>.yml`)

## [v1.0.0] - 2025-09-20

### Added
- Background canvas animation
- i18n support (zh-Hans, zh-Hant, en)
- About page generator
- Code block styling with highlight.js

### Fixed
- Category page link error
- Sidebar TOC active style not applied

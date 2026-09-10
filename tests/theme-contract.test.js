"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const Hexo = require("hexo");

const themeDir = path.resolve(__dirname, "..");
const hostDir = process.env.HEXO_HOST_DIR || path.resolve(themeDir, "../..");

const write = (target, content) => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
};

test("theme honors a subpath root across generated assets, routes, and metadata", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-theme-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));

    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");

    write(path.join(fixtureDir, "_config.yml"), [
        "title: Theme contract fixture",
        "description: Fixture description",
        "author: Fixture author",
        "language: en",
        "url: https://example.test",
        "root: /blog/",
        "theme: hexo-theme-doratiger",
        "permalink: :title/",
        "index_generator:",
        "  path: ''",
        "  per_page: 10",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "global:",
        "  avatar: /images/root-avatar.png",
        "search:",
        "  enable: true",
        "  type: algolia",
        "  algolia:",
        "    app_id: ''",
        "    api_key: ''",
        "    search_key: ''",
        "    index_name: ''",
        "cdn_image:",
        "  enable: true",
        "  fallback:",
        "    enable: true",
        "footer:",
        "  community_records:",
        "    enable: true",
        "    items:",
        "      - name: Moe ICP",
        "        text: Moe ICP 20260001",
        "        url: https://icp.gov.moe/?keyword=20260001",
        "      - name: Felicity ICP",
        "        text: Felicity ICP demo",
        "        url: https://icp.felicity.land/",
        "        icon: /images/community-records/felicity-icp.png",
        "      - name: Remote record",
        "        text: Remote record demo",
        "        url: https://records.example.test/",
        "        icon: https://assets.example.test/record.png",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_data", "doratiger_config.yml"), [
        "global:",
        "  favicon: /images/legacy-favicon.png",
        "  avatar: /images/legacy-avatar.png",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "hello.md"), [
        "---",
        "title: Hello",
        "date: 2026-09-05 00:00:00",
        "excerpt: '<a href=\"https://external.example.test/docs\">external</a>'",
        "---",
        "Hello world.",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "about", "index.md"), [
        "---",
        "title: about",
        "layout: about",
        "---",
        "About.",
    ].join("\n") + "\n");

    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init();
    assert.equal(hexo.env.init, true);
    await hexo.load();
    assert.deepEqual(hexo.locals.get("data").doratiger_config, {
        global: {
            favicon: "/images/legacy-favicon.png",
            avatar: "/images/legacy-avatar.png",
        },
    });
    await hexo.call("generate", { force: true });

    const index = fs.readFileSync(path.join(fixtureDir, "public", "index.html"), "utf8");
    const page404 = fs.readFileSync(path.join(fixtureDir, "public", "404.html"), "utf8");
    const terms = fs.readFileSync(path.join(fixtureDir, "public", "terms", "index.html"), "utf8");
    const css = fs.readFileSync(path.join(fixtureDir, "public", "css", "main.css"), "utf8");

    assert.match(index, /href="\/blog\/css\/main\.css"/);
    assert.match(index, /src="\/blog\/js\/main\.js"/);
    const fallbackScriptIndex = index.indexOf('<script src="/blog/js/utils/cdnImageFallback.js"></script>');
    assert.ok(fallbackScriptIndex >= 0, "the fallback listener must be injected when enabled");
    assert.ok(
        fallbackScriptIndex < index.indexOf("<body"),
        "the fallback listener must register before document images begin loading"
    );
    assert.match(index, /href="\/blog\/images\/legacy-favicon\.png"/);
    assert.match(index, /property="og:image" content="\/blog\/images\/root-avatar\.png"/);
    assert.match(index, /class="author-info-avatar-img" src="\/blog\/images\/root-avatar\.png"/);
    assert.match(index, /class="post-item-header-title" href="\/blog\/hello\/"/);
    assert.match(index, /class="footer-right-community-records-item"/);
    assert.match(index, /Moe ICP 20260001/);
    assert.match(index, /Felicity ICP demo/);
    assert.match(
        index,
        /class="footer-right-record-icon footer-right-community-records-icon" src="\/blog\/images\/community-records\/felicity-icp\.png" alt="" aria-hidden="true" width="16" height="16"/,
        "a local community record icon must preserve the Hexo subpath root and a fixed display size",
    );
    assert.match(
        index,
        /class="footer-right-record-icon footer-right-community-records-icon" src="https:\/\/assets\.example\.test\/record\.png" alt="" aria-hidden="true" width="16" height="16"/,
        "an absolute community record icon URL must remain absolute",
    );
    assert.doesNotMatch(index, /community-records-dialog|footer-community-records-trigger/);
    assert.ok(
        index.indexOf("Moe ICP 20260001") < index.indexOf("Felicity ICP demo")
            && index.indexOf("Felicity ICP demo") < index.indexOf("Remote record demo"),
        "community records must preserve their configured order",
    );
    assert.match(index, /class="external-link" data-redirect="https%3A%2F%2Fexternal\.example\.test%2Fdocs"/);
    assert.doesNotMatch(index, /external\.example\.test\/docs[^>]*target="_blank"/);
    assert.match(index, /<html[^>]*data-redirect-path="\/blog\/redirect\/"/);
    const redirectScriptIndex = index.indexOf('<script type="module" src="/blog/js/utils/externalRedirect.js"></script>');
    assert.ok(redirectScriptIndex >= 0, "the global redirect listener must be injected when enabled");
    assert.ok(redirectScriptIndex < index.indexOf("<body"), "the redirect listener must register before page content");
    const redirectModule = fs.readFileSync(path.join(themeDir, "source", "js", "utils", "externalRedirect.js"), "utf8");
    assert.match(redirectModule, /a\.external-link\[data-redirect\]/);
    assert.match(redirectModule, /decodeURIComponent\(target\)/);
    assert.match(redirectModule, /encodeURIComponent\(target\)/);
    assert.match(redirectModule, /capture:\s*true/);
    assert.match(page404, /window\.location\.href = '\/blog\/'/);
    assert.match(page404, / seconds until returning home/);
    assert.match(terms, /href="\/blog\/privacy\/"/);
    assert.match(terms, /Terms of Service/);
    assert.match(index, /"placeholder":"Search articles"/);
    assert.doesNotMatch(css, /\$color-(?:font|theme-font)/);

    await assert.doesNotReject(hexo.call("algolia", { "dry-run": true }));
    await hexo.exit();
});

test("theme emits selectable celestial appearance tokens", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-appearance-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");
    write(path.join(fixtureDir, "_config.yml"), [
        "title: Appearance fixture", "language: en", "url: https://example.test", "root: /",
        "theme: hexo-theme-doratiger", "permalink: :title/",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "style:", "  appearance: system",
        "sidebar:", "  toc:", "    enable: true",
        "footer:", "  community_records:", "    enable: true", "    items:",
        "      - { text: First, url: 'https://example.test/1' }",
        "      - { text: Second, url: 'https://example.test/2' }",
        "      - { text: Third, url: 'https://example.test/3' }",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "hello.md"), "---\ntitle: Hello\ndate: 2026-09-05\n---\n## Section\n\nHello.\n");
    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init();
    await hexo.load();
    await hexo.call("generate", { force: true });
    const index = fs.readFileSync(path.join(fixtureDir, "public", "index.html"), "utf8");
    const post = fs.readFileSync(path.join(fixtureDir, "public", "hello", "index.html"), "utf8");
    const css = fs.readFileSync(path.join(fixtureDir, "public", "css", "main.css"), "utf8");
    assert.match(index, /data-appearance="system"/);
    assert.match(index, /id="header-right-appearance"/);
    assert.match(index, /class="header-right-appearance-symbol"[^>]*aria-hidden="true">🌙<\/span>/);
    assert.doesNotMatch(index, /header-right-appearance-(?:track|thumb|icon)/);
    assert.match(index, /id="search-container"[^>]*role="dialog"[^>]*aria-modal="true"/);
    assert.match(index, /id="celestial-orbit"/);
    assert.ok(
        index.indexOf('id="search-container"') > index.indexOf('</footer>'),
        "the search dialog must be outside the filtered header shell"
    );
    assert.match(post, /id="sidebar-menu-switch"/);
    assert.match(post, /data-toc-label="Table of Contents"[^>]*><span>Table of Contents<\/span>/);
    assert.match(post, /data-info-label="Site Overview"/);
    assert.doesNotMatch(post, /class="sidebar-toc-title"/);
    assert.match(css, /--dt-canvas:/);
    assert.match(css, /--dt-control:/);
    assert.match(css, /--dt-stage-width:/);
    assert.doesNotMatch(css, /--dt-reading-width:/);
    assert.match(css, /#search-container\.show/);
    assert.match(css, /#celestial-orbit/);
    assert.match(css, /rotate\(180deg\)/);
    assert.match(css, /--dt-control-hover:/);
    assert.doesNotMatch(css, /html\[data-appearance='day'\] #header-right-appearance/);
    assert.match(css, /backdrop-filter:\s*blur\(/);
    assert.match(css, /@media \(min-width: 1600px\)/);
    assert.match(css, /@media \(min-width: 2560px\)/);
    assert.match(css, /--dt-stage-width:\s*min\(104rem, calc\(100vw - 32rem\)\)/);
    assert.match(css, /--dt-celestial-safe-space:/);
    assert.match(css, /@media \(min-width: 1280px\)[\s\S]*--dt-celestial-safe-space/);
    assert.match(css, /@media \(max-width: 1279px\)[\s\S]*--dt-celestial-safe-space:\s*0/);
    assert.match(css, /width:\s*min\(var\(--dt-stage-width\), calc\(100% - \(var\(--dt-celestial-safe-space\) \* 2\) - 2rem\)\)/);
    assert.doesNotMatch(css, /celestial-stage-offset|translateX\(var\(--dt-celestial/);
    assert.match(css, /prefers-color-scheme:\s*light/);
    assert.match(css, /scrollbar-color:/);
    assert.match(css, /\.post-item-more::after/);
    assert.match(css, /content:\s*'\\f105';/);
    assert.doesNotMatch(css, /content:\s*'\\\\f105';/);
    assert.match(css, /#content-wrapper\s*\{[^}]*overflow-y:\s*auto/);
    assert.match(css, /#sidebar-container\.closed ~ #main-container/);
    assert.match(css, /@media \(max-width: 1279px\)[\s\S]*#footer-wrapper #footer-left\s*\{[^}]*display:\s*none/);
    assert.match(index, /<nav id="header-left-menu-list"[^>]*aria-label="Navigation"/,
        "the generated primary navigation must retain semantic navigation markup");
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*#header-left-menu-list\s*\{[\s\S]*position:\s*fixed/,
        "narrow viewports must turn primary navigation into an overlay instead of a horizontal header row");
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*#header-left-menu-list\s*\{[\s\S]*height:\s*100dvh/,
        "the narrow navigation overlay must explicitly fill the viewport");
    assert.match(css, /#header-left-menu-list\.hidden\s*\{[^}]*display:\s*none/,
        "the narrow navigation overlay must be closed before JavaScript runs");
    assert.match(css, /#footer-right\s*\{[\s\S]*flex-wrap:\s*wrap/,
        "legal registration links must be allowed to wrap instead of being removed on narrow screens");
    assert.match(css, /@media \(max-width: 1279px\)[\s\S]*#footer-right\s*\{[\s\S]*flex:\s*1 1 100%/,
        "the footer must give legal registrations a shrinkable full row whenever the sidebar disappears");
    assert.match(css, /#footer-right-mps[\s\S]*a\.mps-text\s*\{[^}]*display:\s*inline-flex/,
        "the public-security registration icon and label must share an alignment context");
    assert.match(css, /post-item-copyright-qrcode[\s\S]*float:\s*right/,
        "a post QR code must float so long copyright text can reclaim the full width below it");
    assert.ok(
        post.indexOf("post-item-copyright-qrcode") < post.indexOf("post-item-copyright-info"),
        "the QR code must precede copyright text so it occupies the top-right of the notice",
    );
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*#comment-container[\s\S]*min-width:\s*0/,
        "comment providers must not force horizontal overflow on mobile");
    assert.match(fs.readFileSync(path.join(themeDir, "source", "css", "_layout", "header.styl"), "utf8"), /\.chrome-control\s*\{[\s\S]*control-surface\(\)/,
        "header controls must share one visual-control contract");
    assert.match(css, /\.search-content\s*\{[\s\S]*scrollbar-color:\s*var\(--dt-scroll-thumb\) var\(--dt-scroll-track\)/,
        "the search dialog must reuse themed scrollbars");
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*post-item-copyright-qrcode\s*\{[\s\S]*display:\s*none/,
        "mobile posts must not render a redundant QR code");
    assert.match(css, /bottom:\s*calc\(var\(--dt-footer-height, 3rem\) \+ 1rem \+ max\(1rem, env\(safe-area-inset-bottom\)\)\)/,
        "the return-top control must clear the measured footer height");
    // Live footer-height tracking is covered by layout-observation.cjs in the browser.
    assert.match(css, /#post \.post-item-content[\s\S]*margin-left:\s*auto/);
    const headerTemplate = fs.readFileSync(path.join(themeDir, "layout", "_include", "header.pug"), "utf8");
    const layoutTemplate = fs.readFileSync(path.join(themeDir, "layout", "_include", "_layout.pug"), "utf8");
    assert.doesNotMatch(headerTemplate, /onclick=|onchange=|addEventListener/);
    assert.doesNotMatch(layoutTemplate, /onclick=|onchange=|addEventListener/);
    assert.match(headerTemplate, /\.chrome-control\.chrome-control-icon/,
        "header actions must opt into the shared chrome-control primitive");
    assert.match(headerTemplate, /header-inline/,
        "header title and clock must opt into the shared inline alignment primitive");
    assert.match(
        fs.readFileSync(path.join(themeDir, "source", "css", "_layout", "header.styl"), "utf8"),
        /\.chrome-control-icon[\s\S]*--dt-control-size[\s\S]*\.header-inline/,
        "header geometry must derive from shared control and inline primitives",
    );
    assert.match(
        fs.readFileSync(path.join(themeDir, "source", "css", "_layout", "header.styl"), "utf8"),
        /@media \(max-width: 767px\)[\s\S]*#header-right-time\s*\{[\s\S]*display: none[\s\S]*#header-right-title\s*\{[\s\S]*left: 50%/,
        "mobile chrome must suppress the clock and center the site title independently",
    );
    assert.match(
        fs.readFileSync(path.join(themeDir, "source", "css", "_layout", "header.styl"), "utf8"),
        /#header-right\s*\{[\s\S]*gap: var\(--dt-header-control-gap\)/,
        "header-right must own one spacing token for controls and inline text",
    );
    assert.match(
        fs.readFileSync(path.join(themeDir, "source", "css", "_layout", "_layout.styl"), "utf8"),
        /@media \(max-width: 1279px\)[\s\S]*#footer-wrapper\s*[\r\n][\s\S]*flex-wrap\s+wrap[\s\S]*#footer-right\s*[\r\n][\s\S]*flex\s+1 1 100%/,
        "the footer must enter its wrapping contract as soon as the sidebar disappears",
    );
    assert.match(css, /#footer-right\s*\{[\s\S]*container-type:\s*inline-size/,
        "footer records must use their own available width as the responsive container");
    assert.match(css, /@container footer-records \(max-width: 74rem\)[\s\S]*footer-right-community-records-item:nth-of-type\(2\)[\s\S]*display:\s*none/,
        "the second community record must fold before the first one");
    assert.match(css, /@container footer-records \(max-width: 85rem\)[\s\S]*footer-right-community-records-item:nth-of-type\(3\)[\s\S]*display:\s*none/,
        "additional community records must also participate in folding");
    assert.doesNotMatch(css, /transition:\s*[^;]*(?:#[0-9a-f]{3,8}|color all)/i,
        "transition property names must not be overwritten by Stylus variables");
    assert.match(css, /@container footer-records \(max-width: 63rem\)[\s\S]*footer-right-community-records-item:nth-of-type\(1\)[\s\S]*display:\s*none/,
        "the first community record must fold only after the second one");
    assert.doesNotMatch(
        fs.readFileSync(path.join(themeDir, "source", "js", "main.js"), "utf8"),
        /layout\/footer\.js|initAutoResizeFooterRight/,
        "footer visibility must remain in CSS rather than a browser measurement controller",
    );
    await hexo.exit();
});

test("appearance tokens drive shared text, overlay, and hero rendering", () => {
    const variableStyles = fs.readFileSync(path.join(themeDir, "source/css/_variable/variable.styl"), "utf8");
    const archiveStyles = fs.readFileSync(path.join(themeDir, "source/css/_layout/archive.styl"), "utf8");
    const postStyles = fs.readFileSync(path.join(themeDir, "source/css/_layout/post.styl"), "utf8");
    const searchStyles = fs.readFileSync(path.join(themeDir, "source/css/_layout/search.styl"), "utf8");
    const commentStyles = fs.readFileSync(path.join(themeDir, "source/css/_layout/comments.styl"), "utf8");
    const sidebarStyles = fs.readFileSync(path.join(themeDir, "source/css/_layout/sidebar.styl"), "utf8");
    const heroModule = fs.readFileSync(path.join(themeDir, "source/js/layout/hero.js"), "utf8");

    assert.match(variableStyles, /--dt-overlay:/);
    assert.match(variableStyles, /--dt-accent-glow:/);
    assert.match(archiveStyles, /color:\s*\$color-text-muted/);
    assert.match(postStyles, /color:\s*\$color-text-muted/);
    assert.match(searchStyles, /background:\s*var\(--dt-overlay\)/);
    assert.match(heroModule, /this\.updatePalette\(\);\s*this\.resize\(\);/);
    assert.doesNotMatch(heroModule, /rgba\(255,\s*255,\s*255/);
    assert.match(commentStyles, /\.gitment-container, \.vwrap, #twikoo/);
    assert.match(commentStyles, /var\(--dt-surface-raised\)/);
    assert.match(sidebarStyles, /\.sidebar-toc-content\s*\{[\s\S]*&::before/);
    assert.match(sidebarStyles, /\.toc-link\s*\{[\s\S]*&::before\s*\{[\s\S]*border-radius:\s*50%/);
    assert.doesNotMatch(sidebarStyles, /sidebar-toc-prefix/);
    assert.match(sidebarStyles, /var\(--dt-accent-glow\)/);
});

test("interactive behavior stays in modules and dialogs isolate the background", () => {
    const postTemplate = fs.readFileSync(path.join(themeDir, "layout", "_include", "post.pug"), "utf8");
    const headerModule = fs.readFileSync(path.join(themeDir, "source", "js", "layout", "header.js"), "utf8");
    const dialogModule = fs.readFileSync(path.join(themeDir, "source", "js", "utils", "dialog.js"), "utf8");
    const encryptFilter = fs.readFileSync(path.join(themeDir, "scripts", "filters", "lib", "encrypt.js"), "utf8");

    assert.doesNotMatch(postTemplate, /window\.QRCode|QRCode\.toDataURL/);
    assert.match(headerModule, /createModalDialog/);
    assert.match(dialogModule, /setBackgroundInteractivity/);
    assert.match(dialogModule, /event\.key !== "Tab"/);
    assert.match(dialogModule, /\.inert = isOpen/);
    assert.match(encryptFilter, /hexo-encrypt-error/);
    assert.match(encryptFilter, /role="alert"/);
    assert.doesNotMatch(encryptFilter, /\balert\s*\(/);
});

test("global redirect handling uses the head injector rather than a page controller", () => {
    const mainModule = fs.readFileSync(path.join(themeDir, "source/js/main.js"), "utf8");
    const injector = fs.readFileSync(path.join(themeDir, "scripts", "injectors", "index.js"), "utf8");
    assert.doesNotMatch(mainModule, /initExternalRedirect/);
    assert.match(injector, /injector-external-redirect/);
});

test("documented page and search switches generate only their enabled surfaces", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-switches-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");
    write(path.join(fixtureDir, "_config.yml"), "title: Switch fixture\nlanguage: en\nurl: https://example.test\nroot: /\ntheme: hexo-theme-doratiger\npermalink: :title/\n");
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "category: { enable: false }", "tag: { enable: false }", "about: { enable: false }",
        "terms: { enable: false }", "privacy: { enable: false }", "page404: { enable: false }",
        "redirect: { enable: false }", "statistics: { enable: true, type: counter, counter: { api: '', uv: true } }",
        "search:", "  enable: true", "  type: local", "  local:", "    path: switch-search.json", "    field: [post]", "    field_merge_strategy: replace", "    content: true", "    content_max_length: 64",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "switch.md"), "---\ntitle: Switch\ndate: 2026-09-05\n---\nSwitch body content.");
    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init(); await hexo.load(); await hexo.call("generate", { force: true });
    const publicDir = path.join(fixtureDir, "public");
    for (const disabled of ["categories/index.html", "tags/index.html", "about/index.html", "terms/index.html", "privacy/index.html", "404.html", "redirect/index.html"]) {
        assert.equal(fs.existsSync(path.join(publicDir, disabled)), false, `${disabled} must stay disabled`);
    }
    assert.equal(fs.existsSync(path.join(publicDir, "switch-search.json")), true);
    const index = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
    assert.match(index, /id="header-right-search"/);
    assert.match(index, /id="site-counter"/);
    assert.doesNotMatch(index, /externalRedirect\.js/);
    await hexo.exit();
});

test("provider, resource, encryption, sitemap, and robots switches generate their documented outputs", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-provider-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");
    write(path.join(fixtureDir, "_config.yml"), "title: Provider fixture\nlanguage: en\nurl: https://example.test\nroot: /\ntheme: hexo-theme-doratiger\npermalink: :title/\n");
    write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), [
        "resource: { enable_cdn: true }",
        "search: { enable: true, type: algolia, algolia: { app_id: fixture-app, search_key: fixture-search, index_name: fixture-index } }",
        "post: { highlight: { enable: true, type: highlight.js } }",
        "statistics: { enable: true, type: busuanzi, busuanzi: { pv: true, uv: true } }",
        "comment: { enable: true, type: valine, valine: { appId: fixture-id, appKey: fixture-key, placeholder: Fixture comment } }",
        "encrypt: { enable: true, abstract: Protected fixture }",
        "sitemap: { enable: true, format: txt }",
        "robots: { enable: true, disallow: [/private/] }",
    ].join("\n") + "\n");
    write(path.join(fixtureDir, "source", "_posts", "secret.md"), "---\ntitle: Secret\ndate: 2026-09-05\npassword: fixture-pass\n---\nThis plaintext must not be published.");
    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init(); await hexo.load(); await hexo.call("generate", { force: true });
    const publicDir = path.join(fixtureDir, "public");
    const index = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
    const post = fs.readFileSync(path.join(publicDir, "secret", "index.html"), "utf8");
    assert.match(index, /https:\/\/cdn\.jsdelivr\.net\/npm\/instantsearch\.css/);
    assert.match(index, /https:\/\/cdn\.jsdelivr\.net\/gh\/highlightjs/);
    assert.match(index, /busuanzi_value_site_uv/);
    assert.doesNotMatch(index, /src="\[&quot;/);
    assert.match(post, /new Valine\(/);
    assert.match(post, /hexo-encrypt/);
    assert.doesNotMatch(post, /This plaintext must not be published/);
    assert.equal(fs.existsSync(path.join(publicDir, "sitemap.xml")), false);
    assert.match(fs.readFileSync(path.join(publicDir, "sitemap.txt"), "utf8"), /https:\/\/example\.test\/secret\//);
    assert.match(fs.readFileSync(path.join(publicDir, "robots.txt"), "utf8"), /Disallow: \/private\//);
    await hexo.exit();
});

test("themeinit console command creates both documented configuration targets", async (t) => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-themeinit-test-"));
    t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
    fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
    fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
    fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
    fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");
    write(path.join(fixtureDir, "_config.yml"), "title: Themeinit fixture\nurl: https://example.test\ntheme: hexo-theme-doratiger\n");
    const hexo = new Hexo(fixtureDir, { silent: true });
    await hexo.init(); await hexo.load(); await hexo.call("themeinit", { legacy: true });
    assert.equal(fs.existsSync(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml")), true);
    assert.equal(fs.existsSync(path.join(fixtureDir, "source", "_data", "doratiger_config.yml")), true);
    await hexo.exit();
});

test("local-search and privacy UI follow the active language", async (t) => {
    const cases = [
        { language: "en", localTitle: "Local Search", privacyTitle: "Privacy Policy", termsTitle: "Terms of Service", countdown: "seconds until returning home" },
        { language: "zh-Hans", localTitle: "本地搜索", privacyTitle: "隐私政策", termsTitle: "服务条款", countdown: "秒后自动返回首页" },
        { language: "zh-Hant", localTitle: "本地搜索", privacyTitle: "隱私政策", termsTitle: "服務條款", countdown: "秒後自動返回首頁" },
    ];
    for (const entry of cases) {
        const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), "doratiger-i18n-test-"));
        t.after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }));
        fs.mkdirSync(path.join(fixtureDir, "themes"), { recursive: true });
        fs.symlinkSync(path.join(hostDir, "package.json"), path.join(fixtureDir, "package.json"));
        fs.symlinkSync(path.join(hostDir, "node_modules"), path.join(fixtureDir, "node_modules"), "dir");
        fs.symlinkSync(themeDir, path.join(fixtureDir, "themes", "hexo-theme-doratiger"), "dir");
        write(path.join(fixtureDir, "_config.yml"), `title: i18n fixture\nlanguage: ${entry.language}\nurl: https://example.test\nroot: /\ntheme: hexo-theme-doratiger\n`);
        write(path.join(fixtureDir, "_config.hexo-theme-doratiger.yml"), "search: { enable: true, type: local }\n");
        write(path.join(fixtureDir, "source", "_posts", "hello.md"), "---\ntitle: Hello\ndate: 2026-09-06\n---\nHello.");
        const hexo = new Hexo(fixtureDir, { silent: true });
        await hexo.init(); await hexo.load(); await hexo.call("generate", { force: true });
        const index = fs.readFileSync(path.join(fixtureDir, "public", "index.html"), "utf8");
        const privacy = fs.readFileSync(path.join(fixtureDir, "public", "privacy", "index.html"), "utf8");
        const terms = fs.readFileSync(path.join(fixtureDir, "public", "terms", "index.html"), "utf8");
        const page404 = fs.readFileSync(path.join(fixtureDir, "public", "404.html"), "utf8");
        assert.match(index, new RegExp(entry.localTitle));
        assert.match(privacy, new RegExp(entry.privacyTitle));
        assert.match(terms, new RegExp(entry.termsTitle));
        assert.match(page404, new RegExp(entry.countdown));
        if (entry.language === "en") assert.doesNotMatch(index, /本地搜索/);
        await hexo.exit();
    }
});

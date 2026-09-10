'use strict';
// Run the real CLI: route locals and theme configuration exist only after Hexo loads.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseDocument, DomUtils } = require('htmlparser2');
const theme = path.resolve(__dirname, '..');
const host = process.env.HEXO_HOST_DIR || path.resolve(theme, '../..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-canonical-'));
const site = path.join(root, 'site');
const write = (name, value) => {
    const file = path.join(site, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
};
const cli = (...args) => spawnSync(process.execPath, [path.join(host, 'node_modules/hexo/bin/hexo'), ...args], { cwd: site, encoding: 'utf8' });
const ok = result => { assert.equal(result.status, 0, result.stdout + result.stderr); assert.doesNotMatch(result.stdout + result.stderr, /\b(?:ERROR|FATAL)\b/); };
const read = (name, dir = path.join(site, 'public')) => fs.readFileSync(path.join(dir, name), 'utf8');
const page = (name, dir) => {
    const document = parseDocument(read(name, dir));
    const find = (tag, key, value) => DomUtils.findAll(node => node.name === tag && node.attribs[key] === value, document.children);
    return {
        canonicals: find('link', 'rel', 'canonical').map(node => node.attribs.href),
        url: find('meta', 'property', 'og:url')[0]?.attribs.content,
        json: DomUtils.textContent(find('script', 'type', 'application/ld+json')[0]),
        hasLink: href => find('a', 'href', href).length > 0,
    };
};
const canonical = page => { assert.ok(page.canonicals.length <= 1); return page.canonicals[0]; };
const config = { title: 'Canonical fixture', author: 'Author "quoted"', url: 'https://primary.example.test/blog', root: '/blog/', theme: 'hexo-theme-doratiger', language: 'en', permalink: ':title/', index_generator: { per_page: 1 }, pretty_urls: { trailing_index: false } };
const settings = { canonical: { enable: true, base_url: '' }, comment: { enable: false }, statistics: { enable: false }, sitemap: { enable: true, format: 'both' } };
const build = () => { write('_config.yml', config); write('_config.hexo-theme-doratiger.yml', settings); ok(cli('clean')); ok(cli('generate')); };
try {
    fs.mkdirSync(path.join(site, 'themes'), { recursive: true });
    fs.symlinkSync(theme, path.join(site, 'themes/hexo-theme-doratiger'));
    fs.symlinkSync(path.join(host, 'node_modules'), path.join(site, 'node_modules'));
    for (const name of ['package.json', 'package-lock.json']) write(name, fs.readFileSync(path.join(host, name), 'utf8'));
    const post = (name, extra = {}) => write(`source/_posts/${name}.md`, `---\n${JSON.stringify({ title: name, date: '2026-09-09', tags: ['中文'], categories: ['notes'], ...extra })}\n---\nArticle.\n`);
    post('hello'); post('second'); post('alias', { canonical: 'https://primary.example.test/blog/hello/' });
    post('external', { canonical: 'https://original.example.test/post/?v=1#part' });
    post('disabled', { canonical: false });
    write('source/about/index.md', '---\ntitle: about\n---\nAbout.');
    build();
    assert.equal(canonical(page('hello/index.html')), 'https://primary.example.test/blog/hello/');
    assert.equal(canonical(page('index.html')), 'https://primary.example.test/blog/');
    assert.equal(canonical(page('page/2/index.html')), 'https://primary.example.test/blog/page/2/');
    assert.equal(canonical(page('about/index.html')), 'https://primary.example.test/blog/about/');
    assert.equal(canonical(page('tags/中文/index.html')), 'https://primary.example.test/blog/tags/%E4%B8%AD%E6%96%87/');
    assert.equal(canonical(page('404.html')), undefined);
    assert.equal(canonical(page('redirect/index.html')), undefined);
    assert.equal(canonical(page('disabled/index.html')), undefined);
    assert.equal(canonical(page('external/index.html')), 'https://original.example.test/post/?v=1');
    const article = page('hello/index.html');
    assert.equal(JSON.parse(article.json).mainEntityOfPage, canonical(article));
    assert.equal(article.url, 'https://primary.example.test/blog/hello/');
    assert.doesNotMatch(read('sitemap.xml'), /\/alias\/|\/external\/|\/disabled\//);
    assert.match(read('sitemap.txt'), /https:\/\/primary\.example\.test\/blog\/hello\//);
    assert.match(read('robots.txt'), /Sitemap: https:\/\/primary\.example\.test\/blog\/sitemap.xml/);
    settings.canonical.base_url = 'https://primary.example.test/blog/';
    config.url = 'https://mirror.example.test/overseas'; config.root = '/overseas/';
    build();
    assert.equal(canonical(page('hello/index.html')), 'https://primary.example.test/blog/hello/');
    assert.equal(page('hello/index.html').url, 'https://mirror.example.test/overseas/hello/');
    assert.ok(page('hello/index.html').hasLink('/overseas/'), 'navigation stays on this deployment');
    assert.equal(fs.existsSync(path.join(site, 'public/sitemap.xml')), false);
    assert.equal(fs.existsSync(path.join(site, 'public/sitemap.txt')), false);
    assert.doesNotMatch(read('robots.txt'), /Sitemap:|Disallow: \/\s*$/m);
    settings.canonical.enable = false; settings.sitemap.format = 'txt';
    build();
    assert.equal(canonical(page('hello/index.html')), undefined);
    assert.match(read('sitemap.txt'), /https:\/\/mirror\.example\.test\/overseas\/hello\//);
    assert.match(read('robots.txt'), /Sitemap: https:\/\/mirror\.example\.test\/overseas\/sitemap.txt/);
    assert.doesNotMatch(read('robots.txt'), /sitemap.xml/);
    settings.sitemap.enable = false; build();
    assert.doesNotMatch(read('robots.txt'), /Sitemap:/);
    settings.canonical = { enable: true, base_url: 'https://primary.example.test/blog' };
    settings.sitemap = { enable: true, format: 'xml' };
    post('local', { canonical: 'https://mirror.example.test/overseas/local/' });
    build();
    assert.equal(read('sitemap.xml').match(/<loc>/g).length, 1, 'a mirror may publish a self-canonical unique page');
    assert.match(read('sitemap.xml'), /https:\/\/mirror\.example\.test\/overseas\/local\//);
    assert.match(read('robots.txt'), /sitemap.xml/);
    assert.doesNotMatch(read('robots.txt'), /sitemap.txt/);
    post('local', { canonical: false });
    // Pretty URLs must follow Hexo without turning each paginated list into page one.
    config.url = 'https://primary.example.test'; config.root = '/';
    settings.canonical.base_url = ''; config.pretty_urls = { trailing_index: true, trailing_html: false };
    write('source/static.md', '---\ntitle: Static\npermalink: static.html\n---\nStatic.');
    build();
    assert.equal(canonical(page('index.html')), 'https://primary.example.test/');
    assert.equal(canonical(page('static.html')), 'https://primary.example.test/static');
    assert.equal(canonical(page('page/2/index.html')), 'https://primary.example.test/page/2/');
    assert.match(read('sitemap.xml'), /<loc>https:\/\/primary\.example\.test\/static<\/loc>/);
    config.index_generator.path = 'news';
    build();
    assert.equal(canonical(page('news/index.html')), 'https://primary.example.test/news/');
    assert.match(read('sitemap.xml'), /<loc>https:\/\/primary\.example\.test\/news\/<\/loc>/);
    assert.doesNotMatch(read('sitemap.xml'), /<loc>https:\/\/primary\.example\.test\/news<\/loc>/);
    delete config.index_generator.path;
    settings.canonical = { enable: true, base_url: 'https://primary.example.test/blog' };
    settings.sitemap = { enable: true, format: 'both' };
    settings.multi_deploy = { enable: true, targets: { mirror: { config: 'mirror.yml', publish: { type: 'git', repo: path.join(root, 'unused.git'), branch: 'pages' } } } };
    config.url = 'https://primary.example.test/blog'; config.root = '/blog/';
    write('_config.yml', config); write('_config.hexo-theme-doratiger.yml', settings);
    write('mirror.yml', { site: { url: 'https://mirror.example.test/overseas', root: '/overseas/' } });
    ok(cli('multi-generate', 'mirror'));
    const pointer = JSON.parse(read('plugins/multi_deploy/latest/mirror.json', site));
    const artifact = path.join(site, 'plugins/multi_deploy', pointer.directory, 'artifact');
    assert.equal(canonical(page('hello/index.html', artifact)), 'https://primary.example.test/blog/hello/');
    assert.equal(fs.existsSync(path.join(artifact, 'sitemap.xml')), false);
    assert.doesNotMatch(read('robots.txt', artifact), /Sitemap:/);
    for (const baseUrl of ['javascript:alert(1)', 'https://user:password@example.test', 'https://example.test/?q=1', 'https://example.test/#fragment']) {
        settings.canonical.base_url = baseUrl;
        write('_config.hexo-theme-doratiger.yml', settings);
        const invalid = cli('generate');
        assert.match(invalid.stdout + invalid.stderr, /CANONICAL_CONFIG/);
        assert.doesNotMatch(invalid.stdout + invalid.stderr, /user:password/);
    }
    settings.canonical.base_url = '';
    write('_config.hexo-theme-doratiger.yml', settings);
    post('invalid', { canonical: '/relative/not-allowed/' });
    const invalidPost = cli('generate');
    assert.match(invalidPost.stdout + invalidPost.stderr, /CANONICAL_CONFIG/);
    console.log('PASS: real Hexo canonical, pagination, subpaths, overrides, sitemap/robots, JSON-LD and multi isolation.');
} finally {
    fs.rmSync(root, { recursive: true, force: true });
}

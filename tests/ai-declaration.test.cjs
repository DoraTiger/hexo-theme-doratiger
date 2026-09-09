'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const theme = path.resolve(__dirname, '..');
const host = process.env.HEXO_HOST_DIR || path.resolve(theme, '../..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'doratiger-ai-'));
const write = (name, value) => { const target = path.join(fixture, name); fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, value); };
try {
    fs.mkdirSync(path.join(fixture, 'themes'));
    for (const name of ['package.json', 'node_modules']) fs.symlinkSync(path.join(host, name), path.join(fixture, name));
    fs.symlinkSync(theme, path.join(fixture, 'themes/hexo-theme-doratiger'));
    for (const [name, ai] of Object.entries({
        single: {tools:[{name:'ChatGPT'}]},
        multiple: {tools:[{name:'ChatGPT',provider:'OpenAI',model:'Example model'},{name:'Other tool'}],usage:['资料整理','Editing'],note:'<script>alert(1)</script>'},
        absent: undefined, disabled: false, invalid: {tools:[{},null,{name:'  '}]},
    })) write(`source/_posts/${name}.md`, `---\n${JSON.stringify({title:name,date:'2026-09-09',ai})}\n---\nArticle body.\n`);
    const build = () => {
        for (const command of ['clean','generate']) {
            const result = spawnSync(process.execPath,[path.join(host,'node_modules/hexo/bin/hexo'),command],{cwd:fixture,encoding:'utf8'});
            assert.equal(result.status,0,result.stdout+result.stderr);
            assert.doesNotMatch(result.stdout+result.stderr,/ERROR|FATAL/);
        }
    };
    const html = name => fs.readFileSync(path.join(fixture,'public',name,'index.html'),'utf8');
    for (const [language, title, multiple] of [['en','AI assistance disclosure','2 tools'],['zh-Hans','AI 辅助说明','2 个工具'],['zh-Hant','AI 輔助說明','2 個工具']]) {
        write('_config.yml',JSON.stringify({title:'AI fixture',url:'https://example.test',root:'/',language,theme:'hexo-theme-doratiger',permalink:':title/'}));
        write('_config.hexo-theme-doratiger.yml',JSON.stringify({comment:{enable:false},statistics:{enable:false},post:{copyright:{enable:false}}}));
        build();
        assert.ok(html('single').includes(title),`${language}: translated declaration title`);
        assert.ok(html('single').includes('href="#post-ai-disclosure"'));
        assert.ok(html('single').indexOf('id="post-ai-disclosure"') > html('single').indexOf('class="post-item-copyright-info"'), 'AI disclosure follows article information');
        assert.ok(html('multiple').includes(multiple));
        const labels = {
            en: ['AI-assisted', 'ChatGPT (OpenAI · Example model), Other tool; used for', 'Author’s note'],
            'zh-Hans': ['AI 辅助', 'ChatGPT（OpenAI · Example model）、Other tool；用于', '补充说明'],
            'zh-Hant': ['AI 輔助', 'ChatGPT（OpenAI · Example model）、Other tool；用於', '補充說明'],
        }[language];
        for (const label of labels) assert.ok(html('multiple').includes(label), `${language}: ${label}`);
        assert.ok(html('multiple').includes('OpenAI · Example model'));
        assert.ok(html('multiple').includes('资料整理'));
        assert.ok(html('multiple').includes('&lt;script&gt;'));
        assert.ok(!html('multiple').includes('<script>alert(1)</script>'));
        for (const name of ['absent','disabled','invalid']) assert.ok(!html(name).includes('id="post-ai-disclosure"'));
        assert.ok(!html('').includes('id="post-ai-disclosure"'),'homepage must not show disclosure');
    }
    write('_config.hexo-theme-doratiger.yml',JSON.stringify({post_extend:{ai_declaration:{enable:false}}}));
    build();
    assert.ok(!html('single').includes('id="post-ai-disclosure"'));
    console.log('PASS: AI declaration CLI builds, three locales, optional fields, absent/invalid/disabled data, escaping and homepage exclusion.');
} finally { fs.rmSync(fixture,{recursive:true,force:true}); }

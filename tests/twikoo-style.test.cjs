'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const stylus = require('stylus');
const { parse } = require('@adobe/css-tools');

// Compile the actual adapter and shared controls. These are CSS contract tests,
// not a substitute for Hexo CLI and browser checks with the bundled Twikoo UI.
const cssRoot = path.resolve(__dirname, '../source/css');
const source = [
    'theme-config(key, fallback) { return fallback; }',
    fs.readFileSync(path.join(cssRoot, '_variable/variable.styl'), 'utf8'),
    fs.readFileSync(path.join(cssRoot, '_mixins/mixins.styl'), 'utf8'),
    fs.readFileSync(path.join(cssRoot, '_layout/comments.styl'), 'utf8'),
].join('\n');
const rules = parse(stylus.render(source)).stylesheet.rules;
const declarations = (selector, selected = rules) => Object.fromEntries(selected
    .filter(rule => rule.type === 'rule' && rule.selectors.includes(selector))
    .flatMap(rule => rule.declarations.filter(item => item.type === 'declaration'))
    .map(item => [item.property, item.value]));

test('Twikoo preview and cancel inherit the same themed control geometry as send', () => {
    const shared = declarations('#twikoo .el-button');
    const primary = declarations('#twikoo .el-button--primary');
    assert.equal(shared['min-height'], '44px', 'secondary actions must not retain Element UI small height');
    assert.equal(shared.display, 'inline-flex');
    assert.equal(shared['align-items'], 'center');
    assert.equal(shared.background, 'var(--dt-control)');
    assert.equal(shared.color, 'var(--dt-text)');
    assert.equal(primary.background, 'var(--dt-accent)');
    assert.equal(primary.color, 'var(--dt-on-accent)');
    assert.equal(declarations('#twikoo .el-button:disabled').cursor, 'not-allowed');
    assert.equal(declarations('#twikoo .el-button:focus-visible').outline, '2px solid var(--dt-accent-secondary)');
});

test('Twikoo grouped fields share the field tokens without rounded or doubled interior seams', () => {
    const field = declarations('#twikoo .el-input__inner');
    const label = declarations('#twikoo .el-input-group__prepend');
    assert.equal(field.border, '1px solid var(--dt-control-border)');
    assert.equal(label.border, field.border);
    assert.equal(label.background, 'var(--dt-control)');
    assert.equal(label['border-right-width'], '0');
    assert.equal(label['border-top-right-radius'], '0');
    assert.equal(declarations('#twikoo .el-input-group--prepend .el-input__inner')['border-top-left-radius'], '0');
    assert.equal(declarations('#twikoo .el-input__inner:focus-visible').outline, '2px solid var(--dt-accent-secondary)');
    assert.equal(declarations('#twikoo .el-textarea__inner').resize, 'none');
});

test('Twikoo reply actions can wrap and mobile spacing overrides the desktop inset', () => {
    assert.equal(declarations('#twikoo .tk-row.actions')['flex-wrap'], 'wrap');
    assert.equal(declarations('#twikoo .tk-row.actions').gap, '0.5rem');
    assert.equal(declarations('#twikoo .tk-row.actions .el-button + .el-button')['margin-left'], '0');
    const mobile = rules.find(rule => rule.type === 'media' && rule.media === '(max-width: 767px)');
    assert.ok(mobile);
    assert.equal(declarations('#twikoo', mobile.rules).padding, '0.75rem');
    assert.ok(rules.indexOf(mobile) > rules.findIndex(rule => rule.type === 'rule' && rule.selectors.includes('#twikoo')),
        'desktop padding must not override the earlier mobile rule');
    assert.equal(declarations('#twikoo .tk-row.actions', mobile.rules)['margin-left'], '0');
    assert.equal(declarations('#twikoo .tk-preview-container', mobile.rules)['margin-left'], '0');
});

test('Twikoo mobile composer releases avatar width without hiding comment-list avatars', () => {
    const mobile = rules.find(rule => rule.type === 'media' && rule.media === '(max-width: 767px)');
    assert.equal(declarations('#twikoo .tk-submit > .tk-row > .tk-avatar', mobile.rules).display, 'none');
    assert.equal(declarations('#twikoo .tk-submit > .tk-row > .tk-col', mobile.rules)['min-width'], '0');
    assert.notEqual(declarations('#twikoo .tk-avatar', mobile.rules).display, 'none');
    assert.notEqual(declarations('#twikoo .tk-submit > .tk-row > .tk-avatar').display, 'none');
});

test('Twikoo hides an empty preview border without suppressing a populated preview', () => {
    assert.equal(declarations('#twikoo .tk-preview-container:empty').display, 'none');
    assert.notEqual(declarations('#twikoo .tk-preview-container').display, 'none');
});

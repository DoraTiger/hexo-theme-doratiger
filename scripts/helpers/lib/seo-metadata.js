'use strict';
const { resolve } = require('../../utils/canonical');
const { parseDocument, DomUtils } = require('htmlparser2');

function plain(value) {
    const document = parseDocument(String(value || ''));
    const remove = nodes => nodes.forEach(node => {
        if (['script', 'style', 'pre', 'code'].includes(node.name)) DomUtils.removeElement(node);
        else if (node.children) remove([...node.children]);
    });
    remove([...document.children]);
    return document.children.map(node => DomUtils.innerText(node)).join(' ').replace(/\s+/g, ' ').trim();
}

module.exports = function (page, post) {
    const t = key => this._p(key);
    const privacy = /^(?:privacy\/)(?:index\.html)?$/.test(page.path || this.path || '');
    let title = page.title || this.config.subtitle || '';
    if (title === 'about' || (!page.title && /^about\/(?:index\.html)?$/.test(page.path || this.path || ''))) title = t('about.title');
    if (privacy) title = this.theme.privacy?.title || t('privacy.title');
    if (this.is_archive()) title = t('archives.title');
    if (this.is_tag()) title = `${t('tags.title')}:${page.tag}`;
    if (this.is_category()) title = `${t('categories.title')}:${page.category}`;
    if (this.is_month()) title += `:${page.month}/${page.year}`;
    else if (this.is_year()) title += `:${page.year}`;
    if (Number(page.current) > 1) title += `${title ? ' - ' : ''}${this.__('seo.page', page.current)}`;
    const description = plain(page.description) ||
        (privacy ? plain(t('privacy.intro')) : '') ||
        Array.from(plain(page.excerpt) || plain(page.content)).slice(0, 160).join('') ||
        plain(this.config.description) || plain(title);
    const urls = resolve(this.config, this.theme, { ...page, path: page.path ?? this.path });
    const data = post ? {
        '@context': 'https://schema.org', '@type': 'Article',
        headline: page.title || '', author: { '@type': 'Person', name: this.config.author },
        datePublished: page.date?.toISOString(), dateModified: page.updated?.toISOString(),
        publisher: { '@type': 'Organization', name: this.config.title },
        mainEntityOfPage: urls.canonical || urls.current,
    } : {
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: this.config.title, url: this.config.url,
    };
    // JSON serialization handles quotes; escaping '<' prevents script termination.
    return { ...urls, title: `${title}【${this.config.title}】`, description, structured: JSON.stringify(data).replace(/</g, '\\u003c') };
};

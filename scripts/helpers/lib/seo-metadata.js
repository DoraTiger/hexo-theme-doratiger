'use strict';
const { resolve } = require('../../utils/canonical');

module.exports = function (page, post) {
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
    return { ...urls, structured: JSON.stringify(data).replace(/</g, '\\u003c') };
};

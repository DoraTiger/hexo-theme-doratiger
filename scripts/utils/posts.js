"use strict";
const { createHash } = require('node:crypto');

const getPosts = (hexo) => {
    const posts = hexo.database
        .model("Post")
        .find({ published: true })
        .sort("date", "asc")
        .toArray();
    return posts;
};

function getNestedValue(obj, path) {
    return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function resolveTagsAndCategories(field) {
    return field.map((field) => {
        return {
            name: field.name,
            path: field.path,
        };
    });
}

const getPostsWithFields = (hexo, fields) => {
    const posts = getPosts(hexo).map((post) => {
        // Database IDs change in clean/isolated builds. Source-relative paths
        // remain stable across domain, permalink, title and content changes.
        if (typeof post.source !== 'string' || !post.source) throw new Error('Missing post source for search identity');
        const objectID = createHash('sha256').update('post\0' + post.source.replace(/\\/g, '/')).digest('hex');
        return {
            ...fields.reduce((acc, field) => {
                const value = getNestedValue(post, field);
                if (value !== undefined) {
                    if (field === "tags" || field === "categories") {
                        acc[field] = resolveTagsAndCategories(value);
                    } else {
                        acc[field] = value;
                    }
                }
                return acc;
            }, {}),
            objectID,
        };
    });
    return posts;
};
module.exports = {
    getPosts,
    getPostsWithFields,
};

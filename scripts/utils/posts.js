"use strict";

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
        const objectID = post._id.toString();
        return {
            objectID,
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
        };
    });
    return posts;
};
module.exports = {
    getPosts,
    getPostsWithFields,
};

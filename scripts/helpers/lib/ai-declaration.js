'use strict';

const text = value => typeof value === 'string' ? value.trim() : '';

// Normalize once for both article surfaces. Never infer tools or author claims.
module.exports = value => {
    if (!value || typeof value !== 'object' || !Array.isArray(value.tools)) return null;
    const tools = value.tools.filter(tool => tool && text(tool.name)).map(tool => ({
        name: text(tool.name),
        detail: [text(tool.provider), text(tool.model)].filter(Boolean).join(' · '),
    }));
    if (!tools.length) return null;
    return {
        tools,
        usage: Array.isArray(value.usage) ? value.usage.map(text).filter(Boolean) : [],
        note: text(value.note),
    };
};

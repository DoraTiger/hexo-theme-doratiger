"use strict";
const getOption = (options, names, defaultValue) => {
    for (let name of names) {
        if (options[name] !== undefined) {
            return options[name];
        }
    }
    return defaultValue;
};

const getBoolOption = (options, names, defaultValue) => {
    let value = getOption(options, names, defaultValue);
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "string") {
        value = value.toLowerCase();
        if (value === "true") {
            return true;
        } else if (value === "false") {
            return false;
        }
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return Boolean(defaultValue);
}

module.exports = {
    getOption,
    getBoolOption
}

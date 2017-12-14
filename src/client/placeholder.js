// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require("./resource");

module.exports = class Placeholder extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    parseParams(json) {
        return {
            is_linked: json.is_linked,
            title: json.title,
            message: json.message
        };
    };
}



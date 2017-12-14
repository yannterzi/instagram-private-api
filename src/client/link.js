// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require("./resource");

module.exports = class Link extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    parseParams(json) {
        var hash = {};
        hash.text = json.text;
        hash.link = {
            url: json.link_context.link_url,
            title: json.link_context.link_title,
            summary: json.link_context.link_summary,
            image: {
                url: json.link_context.link_image_url
            }
        };
        return hash;
    };
}


// @ts-check
const Resource = require('./resource');
const util = require("util");
const _ = require("lodash");
const Request = require('./request');

module.exports = class Save extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    parseParams(json) {
        return json || {};
    };


    static create(session, mediaId) {
        return new Request(session)
            .setMethod('POST')
            .setResource('save', { id: mediaId })
            .generateUUID()
            .setData({
                media_id: mediaId,
                src: "profile"
            })
            .signPayload()
            .send()
            .then(function (data) {
                return new Save(session, {});
            })
    }

    static destroy(session, mediaId) {
        return new Request(session)
            .setMethod('POST')
            .setResource('unsave', { id: mediaId })
            .generateUUID()
            .setData({
                media_id: mediaId,
                src: "profile"
            })
            .signPayload()
            .send()
            .then(function (data) {
                return new Save(session, {});
            })
    }
}

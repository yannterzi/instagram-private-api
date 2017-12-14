// @ts-check
const Resource = require('./resource');
const util = require("util");
const _ = require("lodash");
const crypto = require('crypto');
const camelKeys = require('camelcase-keys');
const Request = require('./request');
const Account = require('./account');
const Media = require('./media');

module.exports = class Comment extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    parseParams(json) {
        var hash = camelKeys(json);
        hash.created = json.created_at;
        hash.status = (json.status || "unknown").toLowerCase();
        hash.id = json.pk || json.id;
        this._account = new Account(this.session, json.user);
        return hash;
    };


    account() {
        return this._account;
    };


    getParams() {
        return _.defaults({
            account: this._account.params
        }, this.params);
    };


    static create(session, mediaId, text) {
        return new Request(session)
            .setMethod('POST')
            .setResource('comment', { id: mediaId })
            .generateUUID()
            .setData({
                media_id: mediaId,
                src: "profile",
                comment_text: text,
                idempotence_token: crypto.createHash('md5').update(text).digest('hex')
            })
            .signPayload()
            .send()
            .then(function (data) {
                return new Comment(session, data.comment)
            })
    }

    static delete(session, mediaId, commentId) {
        return new Request(session)
            .setMethod('POST')
            .setResource('commentDelete', { id: mediaId, commentId: commentId })
            .generateUUID()
            .setData({
                media_id: mediaId,
                src: "profile",
                idempotence_token: crypto.createHash('md5').update(commentId).digest('hex')
            })
            .signPayload()
            .send()
            .then(function (data) {
                return data;
            })
    }

    static bulkDelete(session, mediaId, commentIds) {
        return new Request(session)
            .setMethod('POST')
            .setResource('commentBulkDelete', { id: mediaId })
            .generateUUID()
            .setData({
                media_id: mediaId,
                comment_ids_to_delete: commentIds.join(','),
                src: "profile",
                idempotence_token: crypto.createHash('md5').update(commentIds.join(',')).digest('hex')
            })
            .signPayload()
            .send()
            .then(function (data) {
                return data;
            })
    }

}
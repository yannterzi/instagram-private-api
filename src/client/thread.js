// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require("./resource");
const Promise = require("bluebird");
const camelKeys = require('camelcase-keys');
const Account = require('./account');
const ThreadItem = require('./thread-item');
const Exceptions = require('./exceptions');
const Request = require('./request');
const Helpers = require('../helpers');

function mapPayload(session, payload) {
    return _.map(payload.threads, function (thread) {
        return new Thread(session, thread);
    })
}

function threadsWrapper(session, promise) {
    return promise.then(function (json) {
        if (_.isArray(json.threads))
            return mapPayload(session, json);
        if (_.isEmpty(json.thread_id))
            throw new Error("Not sure how to map an thread!");
        // You cannot fetch thread id inmedietly after configure / broadcast
        return Promise.delay(1000).then(function () {
            return Thread.getById(session, json.thread_id)
        })
            .then(function (thread) {
                return [thread];
            })
    })
}

class Thread extends Resource {
    constructor(session, params) {
        super(session, params);
        this.request = new Request(session);
    }


    parseParams(json) {
        var hash = camelKeys(json);
        var that = this;
        hash.id = json.thread_id;
        if (_.isObject(json.image_versions2))
            hash.images = json.image_versions2.candidates;
        hash.lastActivityAt = parseInt(json.last_activity_at / 1000) || null;
        hash.muted = !!json.muted;
        hash.title = json.thread_title;
        hash.itemsSeenAt = {};
        _.each(json.last_seen_at || [], function (val, key) {
            hash.itemsSeenAt[key] = {
                itemId: val.item_id,
                timestamp: parseInt(parseInt(val.timestamp) / 1000)
            }
        });
        hash.inviter = new Account(that.session, json.inviter);
        this.items = _.map(json.items, function (item) {
            return new ThreadItem(that.session, item);
        });
        this.accounts = _.map(json.users, function (user) {
            return new Account(that.session, user);
        });
        this.leftUsers = _.map(json.left_users, function (user) {
            return new Account(that.session, user);
        });
        return hash;
    };


    getParams() {
        var params = _.clone(this.params);
        params.accounts = _.map(this.accounts, 'params');
        params.items = _.map(this.items, 'params');
        params.inviter = params.inviter.params;
        return params;
    };


    seen() {
        var firstItem = _.first(this.items);
        if (!firstItem)
            throw new Exceptions.ThreadEmptyError();

        return this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsSeen', {
                threadId: this.id,
                itemId: firstItem.id
            })
            .setData({
                client_context: Helpers.generateUUID()
            })
            .send()
            .then((data) => {
                return {
                    unseenCount: data.unseen_count,
                    unseenCountTimestamp: parseInt(data.unseenCountTimestamp / 1000)
                }
            });
    };

    approve() {
        return this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsApprove', {
                threadId: this.id
            })
            .send();
    };


    hide() {
        return this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsHide', {
                threadId: this.id
            })
            .send();
    };


    broadcastText(text) {
        var request = this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastText')
            .setData({
                thread_ids: '[' + this.id + ']',
                client_context: Helpers.generateUUID(),
                text: text
            })
            .send()
        return threadsWrapper(this.session, request)
    };


    broadcastMediaShare(mediaId, text) {
        var payload = {
            thread_ids: '[' + this.id + ']',
            media_id: mediaId,
            client_context: Helpers.generateUUID()
        };
        if (_.isString(text))
            payload.text = text;
        var request = this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastShare')
            .setData(payload)
            .send();
        return threadsWrapper(this.session, request);
    };


    broadcastProfile(profileId, simpleFormat, text) {
        var payload = {
            thread_ids: '[' + this.id + ']',
            simple_format: simpleFormat ? '1' : '0',
            profile_user_id: profileId,
            client_context: Helpers.generateUUID()
        }
        if (_.isString(text))
            payload.text = text;
        var request = this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastProfile')
            .setData(payload)
            .send();
        return threadsWrapper(this.session, request)
    };


    broadcastHashtag(hashtag, simpleFormat, text) {
        var payload = {
            thread_ids: '[' + this.id + ']',
            simple_format: simpleFormat ? '1' : '0',
            hashtag: hashtag,
            client_context: Helpers.generateUUID()
        }
        if (_.isString(text))
            payload.text = text;
        var request = this.request
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastHashtag')
            .setData(payload)
            .send();
        return threadsWrapper(this.session, request)
    };

    // todo configure broadcast /configure location  


    static approveAll(session) {
        return new Request(session)
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsApproveAll')
            .send();
    };


    static getById(session, id) {
        if (_.isEmpty(id))
            throw new Error("`id` property is required!")
        return new Request(session)
            .setMethod('GET')
            .generateUUID()
            .setResource('threadsShow', {
                threadId: id,
                cursor: null
            })
            .send()
            .then(function (json) {
                return new Thread(session, json.thread)
            })
    };


    static configureText(session, users, text) {
        if (!_.isArray(users)) users = [users];
        var link_urls = Helpers.extractUrl(text);
        var endpoint = 'threadsBrodcastText';

        var payload = {
            recipient_users: JSON.stringify([users]),
            client_context: Helpers.generateUUID()
        }

        if (link_urls) {
            payload.link_text = text;
            payload.link_urls = JSON.stringify(link_urls);
            endpoint = 'threadsBrodcastLink';
        } else {
            payload.text = text;
        }

        var request = new Request(session)
            .setMethod('POST')
            .generateUUID()
            .setResource(endpoint)
            .setData(payload)
            .send();
        return threadsWrapper(session, request);
    };

    static configurePhoto(session, users, upload_id) {
        if (!_.isArray(users)) users = [users];

        var payload = {
            recipient_users: JSON.stringify([users]),
            client_context: Helpers.generateUUID(),
            upload_id: upload_id
        };

        var request = new Request(session)
        return request.setMethod('POST')
            .setResource('threadsBrodcastPhoto')
            .generateUUID()
            .setData(payload)
            .send();
    };

    static configureMediaShare(session, users, mediaId, text) {
        if (!_.isArray(users)) users = [users];
        var payload = {
            recipient_users: JSON.stringify([users]),
            client_context: Helpers.generateUUID(),
            media_id: mediaId
        };
        if (_.isString(text))
            payload.text = text;
        var request = new Request(session)
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastShare')
            .setData(payload)
            .send();
        return threadsWrapper(session, request);
    };


    static configureProfile(session, users, profileId, simpleFormat, text) {
        if (!_.isArray(users)) users = [users];
        var payload = {
            recipient_users: JSON.stringify([users]),
            simple_format: simpleFormat ? '1' : '0',
            profile_user_id: profileId,
            client_context: Helpers.generateUUID()
        };
        if (_.isString(text))
            payload.text = text;
        var request = new Request(session)
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastProfile')
            .setData(payload)
            .send();
        return threadsWrapper(session, request)
    };


    static configureHashtag(session, users, hashtag, simpleFormat, text) {
        if (!_.isArray(users)) users = [users];
        var payload = {
            recipient_users: JSON.stringify([users]),
            simple_format: simpleFormat ? '1' : '0',
            hashtag: hashtag,
            client_context: Helpers.generateUUID()
        };
        if (_.isString(text))
            payload.text = text;
        var request = new Request(session)
            .setMethod('POST')
            .generateUUID()
            .setResource('threadsBrodcastHashtag')
            .setData(payload)
            .send();
        return threadsWrapper(session, request)
    };


    static recentRecipients(session) {
        return new Request(session)
            .setMethod('GET')
            .setResource('threadsRecentRecipients')
            .send()
            .then(function (json) {
                return {
                    recentRecipients: json.recent_recipients,
                    expirationInterval: json.expiration_interval
                }
            });
    };
}

module.exports = Thread;

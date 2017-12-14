// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Media = require('../media');
const Request = require('../request');

module.exports = class SelfLikedFeed extends FeedBase {
    constructor(session, limit) {
        super(session);
        this.session = session;
        this.limit = parseInt(limit) || null;
    }

    get() {
        var that = this;
        return new Request(that.session)
            .setMethod('GET')
            .setResource('selfLikedFeed', {
                maxId: that.getCursor()
            })
            .send()
            .then(function (data) {
                var nextMaxId = data.next_max_id ? data.next_max_id.toString() : data.next_max_id;
                that.moreAvailable = data.more_available && !!nextMaxId;
                if (that.moreAvailable)
                    that.setCursor(nextMaxId);
                return _.map(data.items, function (medium) {
                    return new Media(that.session, medium);
                });
            })
    };
}
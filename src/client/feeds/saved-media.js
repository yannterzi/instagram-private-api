// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Media = require('../media');
const Request = require('../request');

module.exports = class SavedFeed extends FeedBase {
    constructor(session, limit) {
        super(session);
        this.timeout = 10 * 60 * 1000; // 10 minutes
        this.limit = limit;
    }

    get() {
        var that = this;
        return new Request(that.session)
            .setMethod('POST')
            .setResource('savedFeed', {
                maxId: that.cursor,
            })
            .generateUUID()
            .setData({})
            .signPayload()
            .send()
            .then(function (data) {
                that.moreAvailable = data.more_available;
                if (that.moreAvailable && data.next_max_id) {
                    that.setCursor(data.next_max_id);
                }
                return _.map(data.items, function (medium) {
                    return new Media(that.session, medium.media);
                });
            })
    };
}


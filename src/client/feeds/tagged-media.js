// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Media = require('../media');
const Request = require('../request');
const Helpers = require('../../helpers');
const Exceptions = require('../exceptions');

module.exports = class TaggedMediaFeed extends FeedBase {
    constructor(session, tag, limit) {
        super(session);
        this.tag = tag;
        this.limit = parseInt(limit) || null;
    }

    get() {
        var that = this;
        return this.session.getAccountId()
            .then(function (id) {
                var rankToken = Helpers.buildRankToken(id);
                return new Request(that.session)
                    .setMethod('GET')
                    .setResource('tagFeed', {
                        tag: that.tag,
                        maxId: that.getCursor(),
                        rankToken: rankToken
                    })
                    .send()
                    .then(function (data) {
                        that.moreAvailable = data.more_available && !!data.next_max_id;
                        if (!that.moreAvailable && !_.isEmpty(data.ranked_items) && !that.getCursor())
                            throw new Exceptions.OnlyRankedItemsError;
                        if (that.moreAvailable)
                            that.setCursor(data.next_max_id);
                        return _.map(data.items, function (medium) {
                            return new Media(that.session, medium);
                        });
                    })
            });
    };
}




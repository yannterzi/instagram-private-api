// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Request = require('../request');
const Helpers = require('../../helpers');
const Media = require('../media');

module.exports = class TimelineFeed extends FeedBase {

    constructor(session, limit) {
        super(session);
        this.limit = parseInt(limit) || null;
    }

    get() {
        const that = this;
        return this.session.getAccountId()
            .then((id) => {
                var rankToken = Helpers.buildRankToken(id);
                return new Request(that.session)
                    .setMethod('GET')
                    .setResource('timelineFeed', {
                        maxId: this.getCursor(),
                        rankToken: rankToken
                    })
                    .send();
            })
            .then((data) => {
                this.moreAvailable = data.more_available;
                var media = _.compact(_.map(data.feed_items, (item) => {
                    var medium = item.media_or_ad;
                    if (!medium || medium.injected) return false;
                    return new Media(that.session, medium);
                }));
                if (this.moreAvailable)
                    this.setCursor(data.next_max_id);
                return media;
            });
    };
}
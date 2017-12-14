// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Media = require('../media');
const Request = require('../request');
const Helpers = require('../../helpers');
const Account = require('../account');

module.exports = class UserMediaFeed extends FeedBase {
    constructor(session, accountId, limit) {
        super(session);
        this.accountId = accountId;
        this.timeout = 10 * 60 * 1000; // 10 minutes
        this.limit = limit;
    }

    get() {
        var that = this;
        return this.session.getAccountId()
            .then(function (id) {
                var rankToken = Helpers.buildRankToken(id);
                return new Request(that.session)
                    .setMethod('GET')
                    .setResource('userFeed', {
                        id: that.accountId,
                        maxId: that.getCursor(),
                        rankToken: rankToken
                    })
                    .send()
                    .then(function (data) {
                        that.moreAvailable = data.more_available;
                        var lastOne = _.last(data.items);
                        if (that.moreAvailable && lastOne)
                            that.setCursor(lastOne.id);
                        return _.map(data.items, function (medium) {
                            return new Media(that.session, medium);
                        });
                    })
            });
    };
}

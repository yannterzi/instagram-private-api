// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Media = require('../media');
const Request = require('../request');
const Helpers = require('../../helpers');
const Exceptions = require('../exceptions');

module.exports = class LocationMediaFeed extends FeedBase {
    constructor(session, locationId, limit) {
        super(session);
        this.limit = parseInt(limit) || null;
        this.locationId = locationId;
    }

    get() {
        var that = this;
        return new Request(that.session)
            .setMethod('GET')
            .setResource('locationFeed', {
                id: that.locationId,
                maxId: that.getCursor(),
                rankToken: Helpers.generateUUID()
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
            // will throw an error with 500 which turn to parse error
            .catch(Exceptions.ParseError, function () {
                throw new Exceptions.PlaceNotFound();
            })
    };
}
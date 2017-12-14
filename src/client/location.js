// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require("./resource");
const camelKeys = require('camelcase-keys');
const Request = require('./request');
const Helpers = require('../helpers');
const Media = require('./media');
const Exceptions = require('./exceptions');

module.exports = class Location extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    static getRankedMedia(session, locationId) {
        return new Request(session)
            .setMethod('GET')
            .setResource('locationFeed', {
                id: locationId,
                maxId: null,
                rankToken: Helpers.generateUUID()
            })
            .send()
            .then(function (data) {
                return _.map(data.ranked_items, function (medium) {
                    return new Media(session, medium);
                });
            })
            // will throw an error with 500 which turn to parse error
            .catch(Exceptions.ParseError, function () {
                throw new Exceptions.PlaceNotFound();
            })
    };


    parseParams(json) {
        var hash = camelKeys(json);
        hash.address = json.location.address;
        hash.city = json.location.city;
        hash.state = json.location.state;
        hash.id = json.location.id || json.location.pk;
        hash.lat = parseFloat(json.location.lat) || 0;
        hash.lng = parseFloat(json.location.lng) || 0;
        return hash;
    };


    static search(session, query) {
        return session.getAccountId()
            .then(function (id) {
                var rankToken = Helpers.buildRankToken(id);
                return new Request(session)
                    .setMethod('GET')
                    .setResource('locationsSearch', {
                        query: query,
                        rankToken: rankToken
                    })
                    .send();
            })
            .then(function (data) {
                return _.map(data.items, function (location) {
                    return new Location(session, location);
                });
            });
    };
}

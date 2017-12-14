var should = require('should');
const { Client } = require('../../../');
var _ = require('lodash');

var shouldBeThread = require('../thread').shouldBeThread;

describe("`InboxPending` class", function() {

    var feed, session;

    before(function() {
        session = require('../../').session;
        feed = new Client.Feed.InboxPending(session);
    });

    it("should not be problem to get pending threads", function(done) {

        feed.get().then(function(items) {
            _.each(items, shouldBeThread);
            feed.isMoreAvailable().should.be.Boolean();
            done();
        })
    })

});
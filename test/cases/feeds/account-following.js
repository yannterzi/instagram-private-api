var should = require('should');
const { Client } = require('../../../');
var Promise = require('bluebird');
var path = require('path');
var mkdirp = require('mkdirp');
var inquirer = require('inquirer');
var _ = require('lodash');
var fs = require('fs');


describe("`AccountFollowing` class", function() {

    var feed, session;

    before(function() {
        session = require('../../').session;
        feed = new Client.Feed.AccountFollowing(session, '193860719');
    })

    it("should not be problem to get followings", function(done) {
        var originalCursor = feed.getCursor();
        feed.get().then(function(data) {
            _.each(data, function(account) {
                account.should.be.instanceOf(Client.Account)
            })
            should(originalCursor).should.not.equal(feed.getCursor())
            feed.moreAvailable.should.be.Boolean();
            feed.moreAvailable.should.equal(false);
            done()
        })
    })
})
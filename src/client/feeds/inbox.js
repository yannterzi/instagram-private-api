// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Thread = require('../thread');
const Request = require('../request');

module.exports = class InboxFeed extends FeedBase {
    constructor(session, limit) {
        super(session);
        this.limit = parseInt(limit) || null;
        this.pendingRequestsTotal = null;
    }

    getPendingRequestsTotal() {
        return this.pendingRequestsTotal;
    };

    get() {
        var that = this;
        return new Request(this.session)
            .setMethod('GET')
            .setResource('inbox', {
                cursor: this.getCursor(),
                type: 'text'
            })
            .send()
            .then(function (json) {
                that.moreAvailable = json.inbox.has_older;
                that.pendingRequestsTotal = json.pending_requests_total;
                if (that.moreAvailable)
                    that.setCursor(json.inbox.oldest_cursor.toString());
                return _.map(json.inbox.threads, function (thread) {
                    return new Thread(that.session, thread);
                })
            })
    };
}
// @ts-check
const _ = require('lodash');
const util = require('util');
const FeedBase = require('./feed-base');
const Exceptions = require('../exceptions');
const Request = require('../request');
const Comment = require('../comment');

module.exports = class MediaCommentsFeed extends FeedBase {
    constructor(session, mediaId, limit) {
        super(session);
        this.mediaId = mediaId;
        this.limit = limit;
    }

    get() {
        var that = this;
        return new Request(that.session)
            .setMethod('GET')
            .setResource('mediaComments', {
                mediaId: that.mediaId,
                maxId: that.getCursor()
            })
            .send()
            .then(function (data) {
                that.moreAvailable = data.has_more_comments && !!data.next_max_id;
                if (that.moreAvailable) {
                    that.setCursor(data.next_max_id);
                }
                return _.map(data.comments, function (comment) {
                    comment.pk = comment.pk.c.join("");
                    comment.media_id = that.mediaId;
                    return new Comment(that.session, comment);
                });
            })
            .catch(function (reason) {
                if (reason.json.message === 'Media is unavailable') throw new Exceptions.MediaUnavailableError();
                else throw reason;
            })
    };

}





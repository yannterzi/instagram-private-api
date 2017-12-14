// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require("./resource");
const camelKeys = require('camelcase-keys');
const Account = require('./account');
const Media = require('./media');
const Location = require('./location');
const Link = require('./link');
const Placeholder = require('./placeholder');
const Hashtag = require('./hashtag');

module.exports = class ThreadItem extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    parseParams(json) {
        var hash = camelKeys(json);
        hash.id = json.item_id || json.id;
        hash.type = json.item_type;

        if (hash.type === "link") {
            hash.link = 'link';
            this.link = new Link(this.session, json.link)
        }

        if (hash.type === "placeholder") {
            hash.placeholder = 'placeholder';
            this.placeholder = new Placeholder(this.session, json.placeholder)
        }
        if (hash.type === "text") {
            hash.text = json.text;
        }
        if (hash.type === "media") {
            hash.media = json.media.image_versions2.candidates;
        }
        if (hash.type === "media_share") {
            hash.type = 'mediaShare';
            this.mediaShare = new Media(this.session, json.media_share)
        }
        if (hash.type === "action_log") {
            hash.type = 'actionLog';
            hash.actionLog = json.action_log;
        }
        if (hash.type === "profile") {
            this.profile = new Account(this.session, json.profile);
            hash.profileMediaPreview = _.map(json.preview_medias || [], function (medium) {
                return {
                    id: medium.id.toString(),
                    images: medium.image_versions2.candidates
                }
            })
        }
        // @Todo media preview just like profile for location and hashtag
        if (hash.type === "location") {
            var location = json.location;
            location.location = Object.create(json.location);
            location.title = location.name;
            location.subtitle = null;
            this.location = new Location(this.session, location);
        }
        if (hash.type === "hashtag") {
            this.hashtag = new Hashtag(this.session, json.hashtag);
        }
        hash.accountId = json.user_id;
        hash.created = json.timestamp / 1000;
        return hash;
    };


    getParams() {
        var params = _.clone(this.params);
        if (params.type == 'link')
            params.link = this.link.params;
        if (params.type == 'placeholder')
            params.placeholder = this.placeholder.params;
        if (params.type == 'mediaShare')
            params.mediaShare = this.mediaShare.params;
        if (params.type == 'profile')
            params.profile = this.profile.params;
        if (params.type == 'location')
            params.location = this.location.params;
        if (params.type == 'hashtag')
            params.hashtag = this.hashtag.params;
        return params;
    }
}

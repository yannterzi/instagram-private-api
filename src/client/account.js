// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require('./resource');
const Request = require('./request');
const Helpers = require('../helpers');
const camelKeys = require('camelcase-keys');
const Exceptions = require('./exceptions');

module.exports = class Account extends Resource {
    constructor(session, params) {
        super(session, params);
    }

    parseParams(json) {
        var hash = camelKeys(json);
        hash.picture = json.profile_pic_url;
        hash.id = json.pk || json.id || json.instagram_id;
        return hash;
    };

    update() {
        return Account.getById(this.session, this.id)
            .then((account) => {
                this.params = account.params
                return this;
            })
    };

    static getById(session, id) {
        return new Request(session)
            .setMethod('GET')
            .setResource('userInfo', { id: id })
            .send()
            .then(function (data) {
                return new Account(session, data.user)
            })
    };

    static search(session, username) {
        return session.getAccountId()
            .then(function (id) {
                var rankToken = Helpers.buildRankToken(id);
                return new Request(session)
                    .setMethod('GET')
                    .setResource('accountsSearch', {
                        query: username,
                        rankToken: rankToken
                    })
                    .send();
            })
            .then(function (data) {
                return _.map(data.users, function (user) {
                    return new Account(session, user);
                });
            })
    };

    static searchForUser(session, username) {
        return Account.search(session, username)
            .then(function (accounts) {
                var account = _.find(accounts, function (account) {
                    return account.params.username === username;
                })
                if (!account)
                    throw new Exceptions.IGAccountNotFoundError();
                return account;
            })
    };

    static setProfilePicture(session, streamOrPath) {
        var stream = Helpers.pathToStream(streamOrPath);
        var request = new Request(session)
        return request.setMethod('POST')
            .setResource('changeProfilePicture')
            .generateUUID()
            .signPayload()
            .transform(function (opts) {
                opts.formData.profile_pic = {
                    value: stream,
                    options: {
                        filename: 'profile_pic',
                        contentType: 'image/jpeg'
                    }
                }
                return opts;
            })
            .send()
            .then(function (json) {
                return new Account(session, json.user)
            })
    };

    setProfilePicture(streamOrPath) {

        return Account.setProfilePicture(this.session, streamOrPath)
            .then((user) => {
                this.params.picture = user.params.picture;
                return this;
            })
    };

    static setPrivacy(session, pri) {
        return new Request(session)
            .setMethod('POST')
            .setResource(pri ? 'setAccountPrivate' : 'setAccountPublic')
            .generateUUID()
            .signPayload()
            .send()
            .then(function (json) {
                return new Account(session, json.user)
            })
    };

    setPrivacy(pri) {

        return Account.setPrivacy(this.session, pri)
            .then((user) => {
                this.params.isPrivate = user.params.isPrivate;
                return this;
            })
    };

    static editProfile(session, settings) {
        settings = _.isObject(settings) ? settings : {};
        if (_.isString(settings.phoneNumber))
            settings.phone_number = settings.phoneNumber;
        if (_.isString(settings.fullName))
            settings.first_name = settings.fullName;
        if (_.isString(settings.externalUrl))
            settings.external_url = settings.externalUrl;
        var pickData = function (o) {
            return _.pick(o, 'gender', 'biography', 'phone_number', 'first_name', 'external_url', 'username', 'email');
        }
        return new Request(session)
            .setMethod('GET')
            .setResource('currentAccount')
            .send()
            .then(function (json) {
                return new Request(session)
                    .setMethod('POST')
                    .setResource('editAccount')
                    .generateUUID()
                    .setData(pickData(_.extend(json.user, settings)))
                    .signPayload()
                    .send()
            })
            .then(function (json) {
                var account = new Account(session, json.user)
                return account.update();
            })
            .catch(function (e) {
                if (e && e.json && e.json.message && _.isArray(e.json.message.errors)) {
                    throw new Exceptions.RequestError({
                        message: e.json.message.errors.join('. ')
                    })
                }
                throw e;
            })
    };

    static showProfile(session) {
        return new Request(session)
            .setMethod('GET')
            .setResource('currentAccount')
            .send()
            .then(function (json) {
                return Account.prototype.parseParams(json.user);
            });
    };

    editProfile(settings) {
        return Account.editProfile(this.session, settings || {});
    };

    showProfile() {
        return Account.showProfile(this.session);
    };
}


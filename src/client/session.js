// @ts-check
const util = require("util");
const Resource = require("./resource");
const fs = require('fs');
const _ = require('lodash');
const request = require("request-promise");
const CookieStorage = require("./cookie-storage");
const RequestJar = require("./jar");

const CONSTANTS = require("./constants");
const Account = require('./account');
const Exceptions = require('./exceptions');
const Request = require('./request');
const Device = require("./device");
const QE = require("./qe");
const Megaphone = require("./megaphone");
const Timeline = require("./feeds/timeline-feed");
const Inbox = require("./feeds/inbox");
const Thread = require("./thread");
const Relationship = require("./relationship");
const Helpers = require("../helpers");

module.exports = class Session extends Resource {
    //jar;
    //cookiesStore;
    //device;
    //proxyUrl;

    constructor(device, storage, proxy) {
        super();
        this.setDevice(device);
        this.setCookiesStorage(storage);
        if (_.isString(proxy) && !_.isEmpty(proxy))
            this.proxyUrl = proxy;
    }

    getCSRFToken() {
        var cookies = this.jar.getCookies(CONSTANTS.HOST)
        var item = cookies.find((cookie) => {
            return cookie.key == 'csrftoken';
        });

        return item ? item.value : "missing";
    }

    setProxyUrl(val) {
        if (!Helpers.isValidUrl(val) && val !== null)
            throw new Error("`proxyUrl` argument is not an valid url")
        this.proxyUrl = val;
    }

    setCookiesStorage(storage) {
        if (!(storage instanceof CookieStorage))
            throw new Error("`storage` is not an valid instance of `CookieStorage`");
        this.cookiesStore = storage;
        this.jar = new RequestJar(storage.store);
        return this;
    };

    setDevice(device) {
        if (!(device instanceof Device))
            throw new Error("`device` is not an valid instance of `Device`");
        this.device = device;
        return this;
    };

    getAccountId() {
        return this.cookiesStore.getSessionId()
            .then(() => {
                return this.cookiesStore.getAccountId();
            });
    }

    setProxy(url) {
        this.proxyUrl = url;
        return this;
    }

    getAccount() {
        return this.getAccountId()
            .then((id) => {
                return Account.getById(this, id);
            })
    };

    destroy() {
        return new Request(this)
            .setMethod('POST')
            .setResource('logout')
            .generateUUID()
            .send()
            .then((response) => {
                this.cookiesStore.destroy();
                delete this.cookiesStore;
                return response;
            })
    };

    static login(session, username, password) {
        return new Request(session)
            .setResource('login')
            .setMethod('POST')
            .generateUUID()
            .setData({
                username: username,
                password: password,
                login_attempt_count: 0
            })
            .signPayload()
            .send()
            .catch((error) => {
                if (error.name == "RequestError" && _.isObject(error.json)) {
                    if (error.json.invalid_credentials)
                        throw new Exceptions.AuthenticationError(error.message);
                    if (error.json.error_type === "inactive user")
                        throw new Exceptions.AccountBanned(error.json.message + ' ' + error.json.help_url);
                }
                throw error;
            })
            .then(() => {
                return [session, QE.sync(session)];
            })
            .spread((session) => {
                var autocomplete = Relationship.autocompleteUserList(session)
                    .catch(Exceptions.RequestsLimitError, function () {
                        // autocompleteUserList has ability to fail often
                        return false;
                    })
                return [session, autocomplete];
            })
            .spread((session) => {
                return [session, new Timeline(session).get()];
            })
            .spread((session) => {
                return [session, Thread.recentRecipients(session)];
            })
            .spread((session) => {
                return [session, new Inbox(session).get()];
            })
            .spread((session) => {
                return [session, Megaphone.logSeenMainFeed(session)];
            })
            .spread((session) => {
                return session;
            })
            .catch(Exceptions.CheckpointError, (error) => {
                // This situation is not really obvious,
                // but even if you got checkpoint error (aka captcha or phone)
                // verification, it is still an valid session unless `sessionid` missing
                return session.getAccountId()
                    .then(() => {
                        // We got sessionId and accountId, we are good to go 
                        return session;
                    })
                    .catch(Exceptions.CookieNotValidError, (e) => {
                        throw error;
                    })
            })
    }

    static create(device, storage, username, password, proxy) {

        var session = new Session(device, storage);
        if (_.isString(proxy) && !_.isEmpty(proxy))
            session.proxyUrl = proxy;
        return session.getAccountId()
            .then(() => { return session })
            .catch(Exceptions.CookieNotValidError, () => {
                // We either not have valid cookes or authentication is not fain!
                return Session.login(session, username, password)
            })
    }
}

// @ts-check
const EventEmitter = require('events').EventEmitter;
const util = require("util");
const _ = require('lodash');
const camelKeys = require('camelcase-keys');
const Request = require("./request");
const Session = require("./session");

module.exports = class Resource extends EventEmitter {
    //params;
    //session;

    constructor(session, params) {
        super();
        if (session && !(session instanceof Session.constructor))
            throw new Error("Argument `session` is not instace of Session");
        this.session = session;
        this.setParams(_.isObject(params) ? params : {});
    }

    setParams(params) {
        if (!_.isObject(params))
            throw new Error("Method `setParams` must have valid argument");
        params = this.parseParams(params);
        if (!_.isObject(params))
            throw new Error("Method `parseParams` must return object");
        this.params = params;
        if (params.id) this.id = params.id;
        return this;
    };

    parseParams(params) {
        // Override this to parse instagram shit
        return params;
    };

}

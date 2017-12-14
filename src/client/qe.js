// @ts-check
const util = require("util");
const _ = require("lodash");
const Resource = require("./resource");
const CONSTANTS = require("./constants");
const Exceptions = require('./exceptions');
const Request = require("./request");

module.exports = class QE extends Resource {
    constructor() {
        super();
    }

    // Lets fake this experiment bullshit
    static sync(session) {
        const random = (Math.random() * 100) + 1;
        const experiments = _.sampleSize(CONSTANTS.EXPERIMENTS, random);
        return session.getAccountId()
            .then(function (id) {
                return new Request(session)
                    .setMethod('POST')
                    .setResource('qeSync')
                    .generateUUID()
                    .setData({
                        id: id,
                        _uid: id,
                        experiments: experiments.join(',')
                    })
                    .signPayload()
                    .send();
            });
    };
}

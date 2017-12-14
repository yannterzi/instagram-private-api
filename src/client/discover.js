// @ts-check
const Request = require('./request');
const Helpers = require('../helpers');
const Media = require('./media');
const Account = require('./account');

module.exports = function discover(session, inSingup) {
    return new Request(session)
        .setMethod('POST')
        .setResource('discoverAyml')
        .generateUUID()
        .setData({
            phone_id: Helpers.generateUUID(),
            in_singup: inSingup ? 'true' : 'false',
            module: 'ayml_recommended_users'
        })
        .send()
        .then(function (json) {
            const group = (json.groups || [])[0];
            const items = group.items || [];
            return items.map(item => {
                return {
                    account: new Account(session, item.user),
                    mediaIds: item.media_ids
                }
            });
        })
};




// @ts-check
const _ = require('lodash');
const util = require('util');
const routes = require('./routes');

class APIError extends Error {

    constructor(message) {
        super();
        this.name = "APIError";
        this.message = message ? message : "Instagram API error was made.";
    }

    serialize() {
        return {
            error: this.name,
            errorMessage: this.message
        }
    }

}

module.exports.APIError = APIError;

module.exports.NotImplementedError = class NotImplementedError extends APIError {

    constructor(message) {
        super();
        this.name = "NotImplementedError";
        this.message = message ? message : "This method is actually not implemented";
    }
}

module.exports.NotAbleToSignError = class NotAbleToSignError extends APIError {

    constructor(message) {
        super();
        this.name = "NotAbleToSign";
        this.message = message ? message : "It's not possible to sign request!";
    }
}

module.exports.RequestError = class RequestError extends APIError {

    constructor(payload) {
        super();
        this.name = "RequestError";
        this.message = payload && payload.message ? payload.message : "It's not possible to make request!";
        this.json = {};
        if (_.isObject(payload)) {
            this.json = payload
        }
    }
}

module.exports.AuthenticationError = class AuthenticationError extends APIError {

    constructor(message) {
        super();
        this.name = "AuthenticationError";
        this.message = message ? message : "Not possible to authenticate";
    }
}

module.exports.ParseError = class ParseError extends APIError {

    constructor(message, response, request) {
        super();
        this.name = "ParseError";
        this.message = message ? message : "Not possible to parse API response";
        this.response = response;
        this.request = request;
    }

    getUrl() {
        return this.request.url;
    };
}

module.exports.ActionSpamError = class ActionSpamError extends APIError {

    constructor(json) {
        super();
        this.json = json;
        this.name = "ActionSpamError";
        this.message = "This action was disabled due to block from instagram!";
    }

    serialize() {
        return Object.assign(super.serialize(), {
            errorData: {
                blockTime: this.getBlockTime(),
                message: this.getFeedbackMessage()
            }
        });
    }

    getBlockTime() {
        if (_.isObject(this.json) && _.isString(this.json.feedback_message)) {
            var hours = this.json.feedback_message.match(/(\d+)(\s)*hour(s)/);
            if (!hours || !_.isArray(hours)) return 0;
            var blockTime = parseInt(hours[1]) * 60 * 60 * 1000;
            return blockTime + (1000 * 60 * 5);
        }
        return 0;
    }

    getFeedbackMessage() {
        var message = "No feedback message";
        if (_.isString(this.json.feedback_message)) {
            var title = _.isString(this.json.feedback_title) ? (this.json.feedback_title + ": ") : "";
            message = title + this.json.feedback_message;
        };
        return message;
    }
}

module.exports.CheckpointError = class CheckpointError extends APIError {

    constructor(json, session) {
        super();
        this.name = "CheckpointError";
        this.message = "Instagram call checkpoint for this action!";
        if (_.isString(json.checkpoint_url))
            this.url = json.checkpoint_url;
        if (!this.url && _.isObject(json.checkpoint) && _.isString(json.checkpoint.url))
            this.url = json.checkpoint.url;
        if (!this.url)
            this.url = routes.getWebUrl('challenge')
        this.session = session;
    }
}

module.exports.SentryBlockError = class SentryBlockError extends APIError {

    constructor(json) {
        super();
        this.name = "SentryBlockError";
        this.message = "Sentry block from instagram";
        this.json = json;
    }
}


module.exports.OnlyRankedItemsError = class OnlyRankedItemsError extends APIError {

    constructor() {
        super();
        this.name = "OnlyRankedItemsError";
        this.message = "Tag has only ranked items to show, due to blocked content";
    }

}

module.exports.NotFoundError = class NotFoundError extends APIError {

    constructor(response) {
        super();
        this.name = "NotFoundError";
        this.message = "Page wasn't found!";
        this.response = response;
    }

}

module.exports.PrivateUserError = class PrivateUserError extends APIError {

    constructor() {
        super();
        this.name = "PrivateUserError";
        this.message = "User is private and you are not authorized to view his content!";
    }

}

module.exports.InvalidParamsError = class InvalidParamsError extends APIError {

    constructor(object) {
        super();
        this.name = "InvalidParamsError";
        this.message = "There was validation error and problem with input you supply";
        this.errorData = object;
    }
    serialize() {
        return Object.assign(super.serialize(), {
            errorData: this.errorData
        });
    }
}

module.exports.TooManyFollowsError = class TooManyFollowsError extends APIError {

    constructor() {
        super();
        this.name = "TooManyFollowsError";
        this.message = "Account has just too much follows";
    }
}

module.exports.RequestsLimitError = class RequestsLimitError extends APIError {

    constructor() {
        super();
        this.name = "RequestsLimitError";
        this.message = "You just made too many request to instagram API";
    }
}

module.exports.CookieNotValidError = class CookieNotValidError extends APIError {

    constructor(cookieName) {
        super();
        this.name = "CookieNotValidError";
        this.message = "Cookie `" + cookieName + "` you are searching found was either not found or not valid!";
    }
}

module.exports.IGAccountNotFoundError = class IGAccountNotFoundError extends APIError {

    constructor() {
        super();
        this.name = "IGAccountNotFoundError";
        this.message = "Account you are searching for was not found!";
    }
}

module.exports.ThreadEmptyError = class ThreadEmptyError extends APIError {

    constructor() {
        super();
        this.name = "ThreadEmptyError";
        this.message = "Thread is empty there are no items!";
    }
}

module.exports.AccountInactive = class AccountInactive extends APIError {

    constructor(accountInstance) {
        super();
        this.name = 'AccountInactive';
        this.message = "The account you are trying to propagate is inactive";
        this.account = accountInstance;
    }
}

module.exports.AccountBanned = class AccountBanned extends APIError {

    constructor(message) {
        super();
        this.name = 'AccountBanned';
        this.message = message;
    }
}

module.exports.AccountActivityPrivateFeed = class AccountActivityPrivateFeed extends APIError {

    constructor() {
        super();
        this.name = 'AccountActivityPrivateFeed';
        this.message = "The Account has private feed, account activity not really completed";
    }
}

module.exports.PlaceNotFound = class PlaceNotFound extends APIError {

    constructor() {
        super();
        this.name = 'PlaceNotFound';
        this.message = "Place you are searching for not exists!";
    }
}

module.exports.NotPossibleToResolveChallenge = class NotPossibleToResolveChallenge extends APIError {

    constructor(reason, code) {
        super();
        this.CODE = {
            RESET_NOT_WORKING: "RESET_NOT_WORKING",
            NOT_ACCEPTING_NUMBER: "NOT_ACCEPTING_NUMBER",
            INCORRECT_NUMBER: "INCORRECT_NUMBER",
            INCORRECT_CODE: "INCORRECT_CODE",
            UNKNOWN: "UNKNOWN",
            UNABLE_TO_PARSE: "UNABLE_TO_PARSE",
            NOT_ACCEPTED: "NOT_ACCEPTED"
        };
        this.name = 'NotPossibleToResolveChallenge';
        this.reason = reason || 'Unknown reason';
        this.code = code || this.CODE.UNKNOWN;
        this.message = "Not possible to resolve challenge (" + reason + ")!";
    }
}

module.exports.NotPossibleToVerify = class NotPossibleToVerify extends APIError {

    constructor() {
        super();
        this.name = 'NotPossibleToVerify';
        this.message = "Not possible to verify trough code!";
    }
}

module.exports.NoChallengeRequired = class NoChallengeRequired extends APIError {

    constructor() {
        super();
        this.name = 'NoChallengeRequired';
        this.message = "No challenge is required to use account!";
    }
}

module.exports.InvalidEmail = class InvalidEmail extends APIError {

    constructor(email, json) {
        super();
        this.name = 'InvalidEmail';
        this.message = email + " email is not an valid email";
        this.json = json;
    }
}

module.exports.InvalidUsername = class InvalidUsername extends APIError {

    constructor(username, json) {
        super();
        this.name = 'InvalidUsername';
        this.message = username + " username is not an valid username";
        this.json = json;
    }
}

module.exports.InvalidPhone = class InvalidPhone extends APIError {

    constructor(phone, json) {
        super();
        this.name = 'InvalidPhone';
        this.message = phone + " phone is not a valid phone";
        this.json = json;
    }
}

module.exports.InvalidPassword = class InvalidPassword extends APIError {

    constructor() {
        super();
        this.name = 'InvalidPassword';
        this.message = "Password must be at least 6 chars long";
    }
}

module.exports.AccountRegistrationError = class AccountRegistrationError extends APIError {

    constructor(message, json) {
        super();
        this.name = 'AccountRegistrationError';
        this.message = message
        this.json = json;
        if (_.isObject(json) && json.errors && !message) {
            this.message = '';
            for (var key in json.errors) {
                this.message += json.errors[key].join('. ')
            }
        }
    }
}

module.exports.TranscodeTimeoutError = class TranscodeTimeoutError extends APIError {

    constructor() {
        super();
        this.name = "TranscodeError";
        this.message = "Server did not transcoded uploaded video in time";
    }
}

module.exports.MediaUnavailableError = class MediaUnavailableError extends APIError {

    constructor() {
        super();
        this.name = "MediaUnavailableError";
        this.message = "Media is unavailable";
    }
}
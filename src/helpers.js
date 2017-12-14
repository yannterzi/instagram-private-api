// @ts-check
const fs = require('fs');
const path = require('path');
const touch = require('touch');
const isStream = require('is-stream');
const validUrl = require('valid-url');
const _ = require('lodash');

const emailTester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-?\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

function validateEmail(email) {
    if (!email) return false;
    if (email.length > 254) return false;
    var valid = emailTester.test(email);
    if (!valid) return false;
    var parts = email.split("@");
    if (parts[0].length > 64) return false;
    var domainParts = parts[1].split(".");
    if (domainParts.some(function (part) { return part.length > 63; }))
        return false;
    return true;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    }).toLowerCase();
};

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}


function buildRankToken(accountId) {
    return accountId + '_' + generateUUID();
};

function ensureExistenceOfJSONFilePath(path) {
    try {
        touch.sync(path);
        JSON.parse(fs.readFileSync(path));
    } catch (e) {
        fs.unlinkSync(path);
    }
    touch.sync(path);
}

function resolveDirectoryPath(directory) {
    directory = path.resolve(directory);
    if (!fs.statSync(directory).isDirectory())
        throw new Error("Path `" + directory + "` is not directory!");
    return directory;
}

function fileExists(path) {
    try {
        return fs.statSync(path).isFile()
    } catch (e) {
        return false;
    }
}

function pathToStream(streamOrPath) {
    var stream = (typeof streamOrPath === 'string') ?
        fs.createReadStream(path.resolve(streamOrPath)) :
        streamOrPath;
    if (!isStream(stream))
        throw new Error("Argument is not posible to convert to stream!");
    return stream;
}

function pathToBuffer(bufferOrPath) {
    return new Promise(function (resolve) {
        if (typeof bufferOrPath !== 'string') {
            return callback(null, bufferOrPath)
        } else {
            fs.readFile(path.resolve(bufferOrPath), callback)
        }

        function callback(err, buffer) {
            if (err) throw err;
            if (!Buffer.isBuffer(buffer))
                throw new Error("Argument is not posible to convert to buffer!");
            return resolve(buffer);
        }
    })
}

function dataToRequestOption(data, filename) {
    var raw, options = {};
    if (typeof filename === 'string')
        options.filename = filename;
    if (data instanceof Buffer) {
        raw = data;
    } else if (isStream(data)) {
        raw = data;
    } else if (typeof data === 'string') {
        raw = pathToStream(data);
    } else if (data === Object(data)) {
        raw = dataToRequestOption(data.value).value;
        options = _.defaults(options, _.omit(data, 'value'));
    } else {
        throw new Error("Invalid data passed as argument for request!")
    }
    return { value: raw, options: options }
}

function extractUrl(text) {
    return text.match(/((?:https\:\/\/)|(?:http\:\/\/)|(?:www\.))?([a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(?:\??)[a-zA-Z0-9\-\._\?\,\'\/\\\+&%\$#\=~]+)/g);
}

module.exports = {
    validateEmail: validateEmail,
    generateUUID: generateUUID, getRandomArbitrary: getRandomArbitrary,
    buildRankToken: buildRankToken,
    isValidUrl: validUrl.isUri,
    ensureExistenceOfJSONFilePath: ensureExistenceOfJSONFilePath,
    resolveDirectoryPath: resolveDirectoryPath,
    fileExists: fileExists,
    pathToStream: pathToStream,
    pathToBuffer: pathToBuffer,
    dataToRequestOption: dataToRequestOption,
    extractUrl: extractUrl,
};
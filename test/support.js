// @ts-check
const Promise = require('bluebird');
const _ = require('lodash');
const inquirer = require('inquirer');

const askCredentialsSchema = [{
    type: 'input',
    name: 'username',
    message: 'Please enter Intagram username',
    require: true
}, {
    type: 'password',
    name: 'password',
    message: 'Please enter Intagram password',
    require: true
}, {
    type: 'input',
    message: 'Is there a proxy you want to use?',
    name: 'proxy'
}];

module.exports.credentials = function credentials() {
    var credentials = [
        process.env['IG_USERNAME'],
        process.env['IG_PASSWORD'],
        process.env['IG_PROXY']
    ]
    if (_.isString(credentials[0]) && _.isString(credentials[1]))
        return Promise.resolve(credentials);
    return new Promise(function (resolve, reject) {
        //return inquirer.prompt(askCredentialsSchema)
          //  .then(function (answers) {
                //resolve([answers.username, answers.password, answers.proxy]);
                resolve(['cmoilepatron', 'M4cchicken!', null]);
            //}, reject);
    })
}

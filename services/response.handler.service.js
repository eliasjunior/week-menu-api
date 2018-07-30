const log = require('../utils/log.message');

const send =  (options) => {
    log.logExceptOnTest("Response status code=", status);
    if(!options.response) {
        error({message: 'response object null'});
    }
    const status = options.status || 200;
    const doc = options.doc || [];

    options.response
        .status(status)
        .json(doc)
        .end();
}

const error = function (options) {
    log.errorExceptOnTest("handling error", options);
    if(!options.response) {
        log.logExceptOnTest('response object null');
    }
    const reason = options.reason || {
        message: options.message || 'Internal server error',
        name: 'Not specified',
        errors: []
    };
    const errorResponse = {
        message : reason.message,
        name: reason.name,
        errors: reason.errors
    };
    options.response
        .status(400) 
        .send(errorResponse)
        .end();
}

module.exports = {
    send,
    error
}
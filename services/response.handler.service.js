const HandlerService = () => {
    const log = require('../utils/log.message');

    const sendRequest = (statusCode, response, doc) => {
        if(response) {
            log.logExceptOnTest('Alert -> response object null');
        }
        response
            .status(statusCode) 
            .send(doc)
            .end();
    };
    const send =  (response, options) => {
        log.logExceptOnTest("Response status code=", options.status);
    
        const status = options.status || 200;
        const doc = options.doc || [];
    
        sendRequest(status, response, doc);     
    };
    const error = (response, options) => {
        log.errorExceptOnTest('======== response handler service =======');
        log.errorExceptOnTest(options);
    
        const errorResponse = {
            message: options.message || 'Internal server error',
            name: options.name || 'Not specified',
            errors: options.errors || []
        };
        sendRequest(400, response, errorResponse);    
    };

    return {
        send,
        error
    }
};
module.exports = HandlerService();
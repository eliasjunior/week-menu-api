const ProductMsgValidation = () => {
    const {VALIDATION} = require('../constants/message.constant');
    const log = require('../utils/log.message');

    return {
        // TODO add test this here
        messageValidation(errorObject) {
            log.logExceptOnTest('===== Validator Error Message =========');
            log.logExceptOnTest(errorObject ? errorObject.message : errorObject);
            log.logExceptOnTest('error code =>',errorObject.code);

            const message = VALIDATION[errorObject.code];

            return {
                message,
                name: errorObject.name,
                errors: errorObject.errors
            }
        }
    }
}

module.exports = ProductMsgValidation();
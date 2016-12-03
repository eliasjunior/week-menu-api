/**
 * Created by eliasmj on 29/11/2016.
 */

(function () {
    'use strict'


    var logExceptOnTest  = function() {

        if(process.env.NODE_ENV !== 'test') {

            if(arguments.length === 2) {
                console.log("Log "+ getLogDate(), arguments[0], arguments[1]);
            } else {
                let date = new Date();
                console.log("Log " + getLogDate(), arguments[0]);
            }

        }

    }

    var errorExceptOnTest  = function() {

        if(process.env.NODE_ENV !== 'test') {

            if(arguments.length === 2) {
                console.error("Error "+ getLogDate(), arguments[0], arguments[1]);
            } else {
                console.error("Error "+ getLogDate(), arguments[0]);
            }

        }

    }


    function getLogDate() {
        let date = new Date();
        return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
    }

    module.exports = {logExceptOnTest, errorExceptOnTest};

})();
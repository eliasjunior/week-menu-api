/**
 * Created by eliasmj on 28/11/2016.
 */

(function () {
    'use strict'

    var env = process.env.NODE_ENV || 'development';

    console.log("ENV ***", env)

    if(env === 'development') {
        process.env.PORT = 3000;
        process.env.MONGODB_URI = 'mongodb://localhost:27017/week_menu';
    } else if(env === 'test') {
        process.env.PORT = 3001;
        process.env.MONGODB_URI = 'mongodb://localhost:27017/week_menu_test';
    } else {
        process.env.MONGODB_URI = 'mongolab-curly-31156/week_menu_test';
    }

})();
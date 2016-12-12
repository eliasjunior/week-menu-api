/**
 * Created by eliasmj on 07/12/2016.
 */

(function () {
    'use strict'

    var mongoose = require('mongoose');

    var options = {discriminatorKey: 'kind'};

    var BaseSchema = new mongoose.Schema({
        updateDate: Date,
        insertDate: Date
    }, options);

    var Base = mongoose.model('Base', BaseSchema);

    module.exports = {Base};

})();
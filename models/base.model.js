/**
 * Created by eliasmj on 07/12/2016.
 *
 */

(function () {
    'use strict'

    const mongoose = require('mongoose');

    const options = {discriminatorKey: 'kind'};

    const BaseSchema = new mongoose.Schema({
        updateDate: Date,
        insertDate: Date,
        name: String
    }, options);

    const Base = mongoose.model('Base', BaseSchema);

    module.exports = {Base};

})();
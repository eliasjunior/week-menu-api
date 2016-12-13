/**
 * Created by eliasmj on 27/11/2016.
 */

(function () {
    'use strict'

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var {Base} = require('./base.model');
    var options = {discriminatorKey: 'kind'};

    var Category = Base.discriminator('Category',
        new mongoose.Schema({
            name: {
                type: String,
                minlength: 1,
                trim: true,
                unique: true,
                required: true,
            },
            ingredients : [{type : Schema.Types.ObjectId, ref: 'Ingredient'}],
            recipes: [{type : Schema.Types.ObjectId, ref: 'Recipe'}]

        }, options));

    module.exports = {Category};
})();
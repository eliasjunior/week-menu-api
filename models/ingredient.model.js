/**
 * Created by eliasmj on 27/11/2016.
 */

(function () {
    'use strict'

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var {Base} = require('./base.model');
    var options = {discriminatorKey: 'kind'};

    var Ingredient = Base.discriminator('Ingredient',
        new mongoose.Schema({
            name: {
                type: String,
                minlength: 1,
                trim: true,
                required: true,
                unique: true
            },
            _creator : {
                type : Schema.Types.ObjectId,
                ref: 'Category'
            },
            expiryDate: {
                type: Date,
                default: Date.now
            },
            //Last checking date from the shopping list after been checked
            updateCheckDate: {
                type: Date,
                default: Date.now
            },
            //for the recipe list, ingredient that needs to buy, some ingredient is in the recipe but does not
            //need to buy
            itemSelectedForShopping: Boolean,
            checkedInCartShopping: Boolean,
        }, options));


    module.exports = {Ingredient};

})();
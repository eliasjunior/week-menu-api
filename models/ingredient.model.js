/**
 * Created by eliasmj on 27/11/2016.
 */

(function () {
    'use strict'

    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    const {Base} = require('./base.model');
    const options = {discriminatorKey: 'kind'};

    const ingredientSchema = new mongoose.Schema({
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
        checkedInCartShopping: Boolean,
        tempRecipeLinkIndicator: Boolean,
        attributes: [{ref: 'IngredientRecipeAttributes', type: Schema.Types.ObjectId }]
    }, options);

    const Ingredient = Base.discriminator('Ingredient',ingredientSchema);

    module.exports = {Ingredient};

})();
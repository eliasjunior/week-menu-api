/**
 * Created by eliasmj on 13/12/2016.
 */

(function () {
    'use strict'

    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    const {Base} = require('./base.model');
    const options = {discriminatorKey: 'kind'};

    const IngredientRecipe = Base.discriminator('IngredientRecipe',
        new mongoose.Schema({
            labelQuantity: {
                type: String
            },
            name: String,
            quantity: Number,
            itemSelectedForShopping: Boolean,
            ingredientId : {type : Schema.Types.ObjectId, ref: 'Ingredient', required: true},
            recipeId : {type : Schema.Types.ObjectId, ref: 'Recipe', required: true},

        }, options));

    module.exports = {IngredientRecipe};
})();
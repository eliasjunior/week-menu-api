/**
 * Created by eliasmj on 27/11/2016.
 */

(function () {
    'use strict'

    var mongoose = require('mongoose');

    var Schema = mongoose.Schema;

    var ingredientSchema = new Schema({
        name: {
            type: String,
            minlength: 1,
            trim: true,
            required: true,
            unique: true
        },
        categoryId : {
            type : Schema.Types.ObjectId,
            ref: 'Category'
        },
        quantities : [{type : Schema.Types.ObjectId, ref: 'Quantity'} ],
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
        shoppingSelectedItem: Boolean
    });

    const Ingredient = mongoose.model('Ingredient', ingredientSchema);

    module.exports = {Ingredient};

})();
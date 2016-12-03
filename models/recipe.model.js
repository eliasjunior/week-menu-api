/**
 * Created by eliasmj on 15/08/2016.
 */
(function () {
    'use strict'

    var mongoose = require('mongoose');

    var Schema = mongoose.Schema;

    var recipeScheme = new Schema({
        name: {
            type: String,
            minlength: 1,
            trim: true,
            required: true,
            unique: true
        },
        weekDay: String,
        checked: {
            type: Boolean,
            default: false
        },
        mainMeal : {
            name : {
                type: String,
                minlength: 1,
                trim: true
            },
            label : String,
            icon: String
        },
        countIngredient: Number,
        description: String
    });

    var Recipe = mongoose.model('Recipe', recipeScheme);

        // var recipesSchema = new Schema({
        //     recipes : [recipeSchema]
        // })
        //
        // return mongoose.model('Recipe', recipesSchema, 'recipes');

    module.exports = {Recipe}

})();

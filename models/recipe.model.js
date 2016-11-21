/**
 * Created by eliasmj on 15/08/2016.
 */

(function () {
    'use strict'

    var mongoose = require('mongoose');

    var Schema = mongoose.Schema;

    exports.recipe = function() {

        var recipeSchema = new Schema({
            name: String,
            weekDay: Number,
            mainMeal : {
                value: String,
                label : String,
                icon : String
            }
        });

        var recipesSchema = new Schema({
            recipes : [recipeSchema]
        })

        return mongoose.model('Recipe', recipesSchema, 'recipes');
    }


})();

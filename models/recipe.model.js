/**
 * Created by eliasmj on 15/08/2016.
 */
(function () {
    'use strict'

    var mongoose = require('mongoose');

    var Schema = mongoose.Schema;

    exports.recipe = function() {
        //
        // weekDay: string;
        // menus: MenuHistory [];
        // categories : Category[]; //to display
        // ingredient_ids: string [];
        // mainMealValue: string;
        // mainMeal: any;
        // countIngredient: number;
        // description: string;

        var recipeSchema = new Schema({
            name: {
                type: String,
                minlength: 1,
                trim: true
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

        var recipesSchema = new Schema({
            recipes : [recipeSchema]
        })

        return mongoose.model('Recipe', recipesSchema, 'recipes');
    }


})();

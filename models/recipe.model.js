/**
 * Created by eliasmj on 15/08/2016.
 */
(function () {
    'use strict'

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var {Base} = require('./base.model');
    var options = {discriminatorKey: 'kind'};

    var Recipe = Base.discriminator('Recipe',
        new mongoose.Schema({
                name: {
                    type: String,
                    minlength: 1,
                    trim: true,
                    required: true,
                    unique: true
                },
                categories : [
                    {type: Schema.Types.ObjectId, ref: 'Category'}
                ],
                weekDay: String,
                isInMenuWeek: {
                    type: Boolean,
                    default: false
                },
                mainMealValue : String,
                countIngredient: Number,
                description: String
            }, options));

    module.exports = {Recipe};



    // var mongoose = require('mongoose');
    // var Schema = mongoose.Schema;
    // var recipeScheme = new Schema({
    //     name: {
    //         type: String,
    //         minlength: 1,
    //         trim: true,
    //         required: true,
    //         unique: true
    //     },
    //     categories : [
    //         {type: Schema.Types.ObjectId, ref: 'Category'}
    //     ],
    //     weekDay: String,
    //     checked: {
    //         type: Boolean,
    //         default: false
    //     },
    //     mainMeal : {
    //         name : {
    //             type: String,
    //             minlength: 1,
    //             trim: true
    //         },
    //         label : String,
    //         icon: String
    //     },
    //     countIngredient: Number,
    //     description: String
    // });
    //
    // var Recipe = mongoose.model('Recipe', recipeScheme);
    //
    // module.exports = {Recipe}

})();

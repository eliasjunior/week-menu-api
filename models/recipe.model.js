/**
 * Created by eliasmj on 15/08/2016.
 */
(function () {
    'use strict'

    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;
    const {Base} = require('./base.model');
    const options = {discriminatorKey: 'kind'};

    const Recipe = Base.discriminator('Recipe',
        new mongoose.Schema({
                name: {
                    type: String,
                    minlength: 1,
                    trim: true,
                    required: true,
                    unique: true
                },
                categories : [{type: Schema.Types.ObjectId, ref: 'Category'}],
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

})();

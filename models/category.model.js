/**
 * Created by eliasmj on 27/11/2016.
 */

(function () {
    'use strict'

    const mongoose = require('mongoose');
    const Schema = mongoose.Schema;

    const categorySchema = new mongoose.Schema({
            name: {
                type: String,
                minlength: 1,
                trim: true,
                unique: true,
                required: true,
            },
            updateDate: Date,
            insertDate: Date,
            ingredients : [{type : Schema.Types.ObjectId, ref: 'Ingredient'}],
            recipes: [{type : Schema.Types.ObjectId, ref: 'Recipe'}]

        });

    const Category = mongoose.model('Category', categorySchema);

    module.exports = {Category};
})();
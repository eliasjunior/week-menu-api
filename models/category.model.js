/**
 * Created by eliasmj on 27/11/2016.
 */

(function () {
    'use strict'

    var mongoose = require('mongoose');

    var Schema = mongoose.Schema;

    var Category = function() {

        var categorySchema = new Schema({
            name: {
                type: String,
                minlength: 1,
                trim: true,
                unique: true
            },

        });

        var categoriesSchema = new Schema({
            recipes : [categorySchema]
        })

        return mongoose.model('category', categoriesSchema, 'categories');
    }

    module.exports = {Category};

})();
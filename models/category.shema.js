const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const product = require('./product.shema');

const category = new Schema(
    {
        name: {
            type: 'string',
            unique: false
        },
        insertDate: {
            type: Date
        },
        products: [product]
    });


module.exports =  category;    
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const product = new Schema(
    {
        name: {
            type: 'string'
        },
        insertDate: {
            type: Date
        },
        completed: {
            type: Boolean,
            default: false
        },
        checked: {
            type: Boolean,
            default: false
        }
    });

module.exports =  product;    
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const product = new Schema(
    {
        name: {
            type: 'string'
        },
        insertDate: {
            type: Date
        }
    });

module.exports =  product;    
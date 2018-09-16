const mongoose = require('mongoose');
mongoose.plugin(schema => { schema.options.usePushEach = true });
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
        
    });

module.exports =  product;    
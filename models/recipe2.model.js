const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const product = new Schema(
    {
        name: {
            type: 'string',
            unique: false
        },
        categoryName: 'string', 
        _creator: {
            type: Schema.Types.ObjectId,
            ref: 'Category'
        }
    });

const recipeSchema = new mongoose.Schema({
    name: {
        type: String,
        minlength: 1,
        trim: true,
        required: true,
        unique: true
    },
    updateDate: Date,
    insertDate: Date,
    products: [product],
});

const Recipe2 = mongoose.model('Recipe2', recipeSchema);

module.exports = { Recipe2 };
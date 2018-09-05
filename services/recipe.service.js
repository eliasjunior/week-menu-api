const { Recipe2 } = require('../models/recipe2.model');
const ProductValidation = require('../services/product.validation');

const RecipeService = () => {
    return {
        save(recipePayload) {
            const recipeModel = new Recipe2({
                name: recipePayload.name,
                insertDate: new Date(),
                categories: recipePayload.categories
            });
            return recipeModel.save()
                .then(doc => doc)
                .catch(reason => Promise
                        .reject(ProductValidation.messageValidation(reason)));
        },
        update(recipePayload) {
            return Recipe2.findById(recipePayload._id)
                .then(recipe => {
                    recipe.name = recipePayload.name;
                    recipe.updateDate = new Date();
                    recipe.categories = recipePayload.categories;
                    return recipe.save();
                }).catch(reason => Promise
                    .reject(ProductValidation.messageValidation(reason)));
        },
        get() {
            return Recipe2.find()
                .populate('categories')
                .sort({ 'name': 1 })
                .then(recipes => recipes)
                .catch(reason => Promise
                    .reject(ProductValidation.messageValidation(reason)));
        },
        getOne(id) {
            return Recipe2.findById(id)
                .populate('categories')
                .then(recipe => recipe)
                .catch(reason => Promise
                    .reject(ProductValidation.messageValidation(reason)));
        }
    }
}

module.exports = RecipeService();

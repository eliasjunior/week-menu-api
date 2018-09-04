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
        update(recipe) {

        },
        get() {
            return Recipe2.find()
                .populate('categories')
                .sort({ 'name': 1 })
                .then(recipes => recipes)
                .catch(reason => Promise
                    .reject(ProductValidation.messageValidation(reason)));
        }
    }
}

module.exports = RecipeService();

const { Recipe2 } = require('../models/recipe2.model');
const ProductValidation = require('../services/product.validation');

const RecipeService = () => {
    return {
        save(recipe) {
            const recipeModel = new Recipe2({
                name: recipe.name,
                insertDate: new Date(),
                products: recipe.products
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
                .populate('products')
                .sort({ 'name': 1 })
                .then(recipes => recipes)
                .catch(reason => Promise
                    .reject(ProductValidation.messageValidation(reason)));
        }
    }
}

module.exports = RecipeService();

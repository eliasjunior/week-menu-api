const ProductService = () => {
    const log = require('../utils/log.message');
    const { Ingredient } = require('../models/ingredient.model');
    const ProductValidation = require('./product.validation');
    const CategoryService = require('./category.service');

    const addProductToCategory = (id, product) => {
        return CategoryService.addProduct(id, product);
    };

    return {
        update(productRequest) {
            log.logExceptOnTest("update -> ", productRequest.name);
            const updateObject = {
                name: productRequest.name
            };
            return Ingredient
                .findByIdAndUpdate(productRequest._id, { $set: updateObject })
                .then(doc => doc)
                .catch(reason => Promise.reject(reason));
        },
        save(productRequest) {
            if (!productRequest._creator) {
                return Promise
                    .reject(ProductValidation.messageValidation({
                        code: 'INTERNAL_REQUIRE_CAT',
                        name: ' custom'
                    }));
            }
            const ingredientModel = new Ingredient({
                name: productRequest.name,
                _creator: productRequest._creator,
                insertDate: new Date()
            });
            return ingredientModel.save()
                .then(doc => addProductToCategory(productRequest._creator, doc))
                .catch(reason => {
                    return Promise
                        .reject(ProductValidation.messageValidation(reason));
                });
        }
    }
}
module.exports = ProductService();
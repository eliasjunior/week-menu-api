const ProductValidation = require('./product.validation');
const CategoryService = require('./category.service');
const { Category } = require('../models/category.model');
const RecipeSubdocService = require('./recipe.subdoc.service');

const ProductService = () => {
    // TODO add Tests, check _id from id
    return {
        update(productPayLoad) {
            const product = productPayLoad.product;
            const category = productPayLoad.category;

            if (!category) {
                return Promise
                    .reject(ProductValidation.messageValidation({
                        code: 'INTERNAL_REQUIRE_CAT',
                        name: ' custom'
                    }));
            }
            return Category
                .findOne({ name: category.name })
                .then(updateProduct.bind(null, product))
                .catch(reason => Promise.reject(reason));
        },
        save(productPayLoad) {
            const product = productPayLoad.product;
            const category = productPayLoad.category;
            if (!category) {
                return Promise
                    .reject(ProductValidation.messageValidation({
                        code: 'INTERNAL_REQUIRE_CAT',
                        name: ' custom'
                    }));
            }
            return CategoryService.addProduct(product, category._id)
                .then(doc => doc)
                .catch(reason => {
                    return Promise
                        .reject(ProductValidation.messageValidation(reason));
                });
        }
    }
}
function updateProduct(product, category) {
    if (!category) {
        return Promise
            .reject(ProductValidation.messageValidation({
                code: 'INTERNAL_REQUIRE_CAT',
                name: ' custom'
            }));
    }
    category.products.id(product._id).name = product.name;
    // Update all subs
    return category.save()
        .then(() => RecipeSubdocService.updateProduct(product._id, product.name))
        .catch(reason => Promise.reject(reason))
}
module.exports = ProductService();
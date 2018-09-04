const ProductService = () => {
    const log = require('../utils/log.message');
    const ProductValidation = require('./product.validation');
    const CategoryService = require('./category.service');
    const { Category } = require('../models/category.model');


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
                .findOne({name: category.name})
                .then(doc => {
                    
                    if(!doc){
                        return Promise
                        .reject(ProductValidation.messageValidation({
                            code: 'INTERNAL_REQUIRE_CAT',
                            name: ' custom'
                        }));
                    }
                    doc.products.id(product._id).name = product.name;
                    return doc.save();
                })
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
                .then( doc => doc)
                .catch(reason => {
                    return Promise
                        .reject(ProductValidation.messageValidation(reason));
                });
        }
    }
}
module.exports = ProductService();
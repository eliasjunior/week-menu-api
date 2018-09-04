const { Category } = require('../models/category.model');
const ProductValidation = require('../services/product.validation');

function CategoryService() {
    return {
        save(category) {
            const categoryModel = new Category({
                name: category.name,
                insertDate: new Date(),
            });
            return categoryModel.save()
                .then(doc => doc)
                .catch(reason => {
                    return Promise
                        .reject(ProductValidation.messageValidation(reason));
                });
        },
        update(category) {
            return Category
                .findOne({_id: category._id})
                .then(doc => {
                    doc.name = category.name;
                    return doc.save();
                }).catch(reason => {
                    return Promise
                        .reject(ProductValidation.messageValidation(reason));
                });
        },
        addProduct(product, id) {
            return Category.findOne({_id: id})
                .then(category => {
                    category.products.push(product);
                    return category.save();
                }).catch(reason => {
                    return Promise.reject(reason);
                });
        },
        get() {
            return Category.find()
                .populate('products')
                .sort({ 'name': 1 })
                .then(categories => categories)
                .catch(reason => Promise.reject(reason));
        }
    }
}

module.exports = CategoryService();


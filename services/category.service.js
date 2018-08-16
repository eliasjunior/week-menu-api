const CategoryService = () => {
    // const log = require('../utils/log.message');
    const { Category } = require('../models/category.model');

    return {
        save: (category) => {

        },
        update: (category) => {

        },
        addProduct: (id, ingredient) => {
            return Category.findOne({ _id: id })
                .then(category => {
                    try {
                        if(!category.ingredients.find(ing => ing._id === ingredient._id)) {
                            category.ingredients.push(ingredient);
                        }
                        return category.save();
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }).catch(reason => {
                    return Promise.reject(reason);
                });
        }
    }
}

module.exports = CategoryService();


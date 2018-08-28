const CategoryService = () => {
    const { Category } = require('../models/category.model');

    return {
        save(category) {

        },
        update(category) {

        },
        addProduct(id, ingredient) {
            return Category.findOne({ _id: id })
                .then(category => {
                    try {
                        if (!category.ingredients.find(ing => ing._id === ingredient._id)) {
                            category.ingredients.push(ingredient);
                        }
                        return category.save();
                    } catch (error) {
                        return Promise.reject(error);
                    }
                }).catch(reason => {
                    return Promise.reject(reason);
                });
        },
        get() {
            return Category.find()
                .populate('ingredients')
                .sort({ 'name': 1 })
                .then(categories => categories)
                .catch(reason => Promise.reject(reason));
        }
    }
}

module.exports = CategoryService();


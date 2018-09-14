const { ShoppingList } = require('../models/shopping.list.model');
const CustomValidation = require('./custom.validation');
const appConstant = require('../constants/app.constant');

const ShoppingListService = {
    save(shoppingListData) {
        if (shoppingListData.recipes.length === 0
            && shoppingListData.categories.length === 0) {
            return customError('REQUIRE_REC_OR_CAT');
        }
        const shoppingListModel = new ShoppingList({
            name: getDayName(),
            insertDate: new Date(),
            recipes: shoppingListData.recipes,
            categories: shoppingListData.categories
        });
        return shoppingListModel.save()
            .then(doc => doc)
            .catch(reason => Promise
                .reject(CustomValidation.messageValidation(reason)));
    },
    update(shoppingListData) {
        if (!shoppingListData._id) {
            return customError('REQUIRE_ID');
        }
        return ShoppingList
            .findById(shoppingListData._id)
            .then(doc => {
                doc.categories = shoppingListData.categories;
                doc.recipes = shoppingListData.recipes;
                doc.updateDate = new Date();
                return doc.save();
            })
            .catch(reason => Promise
                .reject(CustomValidation.messageValidation(reason)))
    },
    updateItem(productItem) {
        if (!productItem.shopId ||
            (!productItem.recId &&
            !productItem.catId)
            ) {
            return customError('REQUIRE_ID');
        }
        return ShoppingList
            .findById(productItem.shopId)
            .then(doc => {
                let product = updateProductFlag(doc, productItem);
                if (product) {
                    return doc.save();
                }
                return customError('ITEM_NOT_FOUND')
            });
    },
    get() {
        return ShoppingList
            .find()
            .sort({ '_id': -1 })
            .populate('categories')
            .sort({ 'name': 1 })
            .populate('recipes')
            .sort({ 'name': 1 })
            .then(docs => docs)
            .catch(reason => Promise
                .reject(CustomValidation.messageValidation(reason)));
    },
    getOne(id) {
        return ShoppingList.findById(id)
            .populate('categories')
            .sort({ 'name': 1 })
            .populate('recipes')
            .sort({ 'name': 1 })
            .then(doc => doc)
            .catch(reason => Promise
                .reject(CustomValidation.messageValidation(reason)));
    }
}

function getDayName() {
    const time = new Date();
    const dayLabel = appConstant.days[time.getDay()];

    return `${dayLabel} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
}

function updateProductFlag(doc, productItem) {
    const recipe = doc.recipes.id(productItem.recId);
    if (recipe) {
        const category = recipe.categories.id(productItem.catId);
        if (category) {
            const product = category.products.id(productItem._id);
            if (product) {
                product.completed = productItem.completed;
                return product;
            }
        }
    }
    else {
        const category = doc.categories.id(productItem.catId);
        if (category) {
            const product = category.products.id(productItem._id);
            if (product) {
                product.completed = productItem.completed;
                return product;
            }
        }
    }
    return false;
}

function customError(code) {
    return Promise
        .reject(CustomValidation.messageValidation({
            code: code,
            name: ' custom'
        }));
}

module.exports = ShoppingListService;
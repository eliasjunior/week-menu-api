const { ShoppingList } = require('../models/shopping.list.model');
const CustomValidation = require('./custom.validation');
const appConstant = require('../constants/app.constant');

const ShoppingListService = {
    save(shoppingListData) {
        if(shoppingListData.recipes.length === 0 
            && shoppingListData.categories.length === 0) {
            return Promise
                .reject(CustomValidation.messageValidation({
                    code: 'REQUIRE_REC_OR_CAT',
                    name: ' custom'
                }));
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
        ShoppingList
            .findById(shoppingListData._id)
            .then(doc => {
                doc.categories = shoppingListData.categories;
                doc.recipes = shoppingListData.recipes;
                doc.name = shoppingListData.name;
                doc.updateDate = new Date();
                return doc.save();
            })
            .catch(reason => Promise
                .reject(CustomValidation.messageValidation(reason)))
    },
    get() {
        return ShoppingList.find()
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

    return `${dayLabel} ${time.getHours()}:${time.getMinutes()}` 
}

module.exports = ShoppingListService;
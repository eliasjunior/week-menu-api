/**
 * Created by eliasmj on 26/11/2016.
 */
const express = require('express');
const router = express.Router();

const array = require('lodash/array');

const log = require('../utils/log.message');

const {Recipe} = require('../models/recipe.model');

const {Category} = require('../models/category.model');

const {Ingredient} = require('../models/ingredient.model');

const {IngredientRecipeAttributes} = require('../models/ingredient.recipe.attributes.model');

const Q = require('q');


router.get("/recipe", (req, res, next) => {

    Recipe.find().then((doc) => {
        handleResponse(res, doc, 200);
    }, (reason) => {
        wmHandleError(res, reason);
    });
});

router.get("/recipe/week", (req, res, next) => {

    Recipe.find({isInMenuWeek: true}).then(doc => {

        handleResponse(res, doc, 200);
    }, (reason) => {
        wmHandleError(res, reason);
    });
});


router.get("/recipe/:id", (req, res, next) => {

    log.logExceptOnTest("Recipe name", req.params.id);

    Recipe.findOne({_id: req.params.id})
        .then((doc) => {
            handleResponse(res, doc, 200);
        }, (reason) => {
            wmHandleError(res, reason);
        });

});


router.get("/recipe/category/:id", (req, response, next) => {

    Recipe
        .findOne({_id: req.params.id})
        .populate('categories')
        .then((populated) => {

            var options = {
                path: 'categories.ingredients',
                model: 'Ingredient'
            };

            /**
             * TODO need to write a test case for it
             * Make sure after check and unchecked it will return the corretc list
             *
             * Also test together the caegory resource /category/check/:recipeId that is direct
             * related to this rule
             * TODO
             */

            Recipe.populate(populated,options)
                .then(deepPopulated => {
                    //console.log("deep docSaved", deepPopulated.categories);

                    //I need to check if there is an attribute flag true
                    // for each ingredients and return filtered based on it.
                    IngredientRecipeAttributes
                        .find({recipeId: deepPopulated._id}).where('recipeFlagSelected').equals(true)
                        .then(attributes => {

                            deepPopulated.categories.forEach(category => {

                                //console.log("Ingredient SIZE=", category.ingredients.length)

                                let filteredIng = category.ingredients.filter(ing => {

                                    let found = attributes
                                        .find(atrr  => atrr.ingredientId.toString() === ing._id.toString())


                                    console.log(ing.name + " FOUND=", found !== undefined)
                                    return found !== undefined;

                                });

                               // console.log("Filtered SIZE =", filteredIng.length)

                                category.ingredients = filteredIng;
                            });

                            //filtering category with ingredients == 0
                            let newFilteredList = deepPopulated.categories.filter(cat => cat.ingredients.length > 0)

                            deepPopulated.categories = newFilteredList;

                            handleResponse(response, deepPopulated, 200);
                        })


                }).catch( (reason) => {
                wmHandleError(response, reason);
            });

        }, (reason) => {
            wmHandleError(response, reason);
        });
});

router.get("/recipe/category/currentAttribute/:id", (req, response, next) => {

    Recipe
        .findOne({_id: req.params.id})
        .populate('categories')
        .then(populated => {

            const options = {
                path: 'categories.ingredients',
                model: 'Ingredient'
            };

            Recipe.populate(populated,options)
                .then(recipeDeepPopulated => {

                    const options2 = {
                        path: 'categories.ingredients.attributes',
                        model: 'IngredientRecipeAttributes',
                        match: {recipeId : req.params.id, recipeFlagSelected: true}
                    };

                    Recipe.populate(recipeDeepPopulated, options2)
                        .then(level3 => {

                            console.log("Before filter", level3.categories)

                            level3.categories.forEach(cat => {

                                let filteredIng = cat.ingredients.filter(ing => ing.attributes.length > 0);

                                cat.ingredients = filteredIng;

                            });

                            let filteredCats = level3.categories.filter(cat => cat.ingredients.length > 0);

                            level3.categories = filteredCats;

                            // console.log("deep docSaved", level3.categories);
                            handleResponse(response, level3, 200);
                        })

                }).catch( (reason) => {
                wmHandleError(response, reason);
            });

        }, (reason) => {
            wmHandleError(response, reason);
        });
});


router.post('/recipe', (request, res, next) => {

    let recipeCommand = request.body;

    var recipe = new Recipe({
        name : recipeCommand.name,
        weekDay: recipeCommand.weekDay,
        isInMenuWeek: recipeCommand.isInMenuWeek,
        mainMealValue: recipeCommand.mainMealValue,
        menus: recipeCommand.menus,
    });

    recipe.save()
        .then((doc) => {
            handleResponse(res, doc, 201);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});

router.put('/recipe', (request, res, next) => {
    // ** Concept status ** use 204 No Content to indicate to the client that
    //... it doesn't need to change its current "document view".

    let recipeCommand = request.body;

    Recipe.findOne({_id: recipeCommand._id})
        .then((docUpdated) => {

            docUpdated.name = recipeCommand.name;
            docUpdated.weekDay = recipeCommand.weekDay;
            docUpdated.mainMealValue = recipeCommand.mainMealValue;
            docUpdated.description = recipeCommand.description;
            docUpdated.isInMenuWeek = recipeCommand.isInMenuWeek;

            //TODO not update the list yet

            docUpdated.save()
                .then( () => {
                    handleResponse(res, docUpdated, 204);
                }, (reason) => wmHandleError(res, reason));

        }, (reason) => wmHandleError(res, reason));
});

/**
 * only one category request
 * there is cat => delete, push
 * there is not => push

 * there is Attr => push
 * there is not => create, push

 save ingredient and recipe arrays
 */
router.put("/recipe/ingredient", (request, response, next) => {

    //only one ingredient
    // check false or true(checkbox)
    //false need to remove from cat
    //true add to cat

    Recipe
        .findOne({_id: request.body._id})
        .populate('categories')
        .then(recipe => {

            //on Ionic app its always sending one array, after each action check it sends only one ingredient
            let ingredient = request.body.ingredient;

            //TODO for the future, if tempRecipeLinkIndicator=false does not need create attribute
            getAttribute(recipe, ingredient)
                .then(saveInIngredient.bind(null, ingredient._id))
                .then(attribute => {

                    console.log('Begin', attribute.name, attribute.recipeFlagSelected);

                    //TODO review recipe.attributes Im not using it
                    addItem(recipe.attributes, attribute);

                    let tempCategory = find(recipe.categories, ingredient._creator);

                    if(!tempCategory) {
                        addCategoryToRecipe(recipe, ingredient._creator)
                            .then(carryOn);
                    } else {
                        //if there is cat only carry on
                        carryOn(tempCategory);
                    }

                    function carryOn(category) {

                        if(attribute.recipeFlagSelected) {

                            console.log('BEFORE  add', category.ingredients.length)

                            let added = addItem(category.ingredients, ingredient);

                            console.log('AFTER added '+added , category.ingredients.length)

                        } else {
                            console.log(" flag was false unchecked")

                        }

                        category.save()
                            .then(() => {

                                recipe.save().then(() => {
                                    handleResponse(response, {}, 204);

                                }).catch(reason => wmHandleError(response, reason));
                            }).catch(reason => wmHandleError(response, reason));
                    }

                });

        }, (reason) => {
            wmHandleError(response, reason);
        });
});

router.delete('/recipe', (req, res, next) => {

    Recipe.findByIdAndRemove(req.body._id)
        .then((doc) => {
            handleResponse(res, doc, 204);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});


//TODO move to utils
function addItem(list, item) {

    let tempItem = list.find(itemIn => {

        return getValue(itemIn) === getValue(item);
    });

    if(!tempItem) {
        list.push(item);
        return true;
    } else {
        return false
    }
}

//TODO move to utils
function getValue(value) {

    return value['_id'] !== undefined ? value._id.toString() : value.toString();

}

//TODO move to utils
function findIndex(list, id) {

    return list.findIndex(item => getValue(item) === getValue(id));
}

//recipe does not have category added yet
function addCategoryToRecipe(recipe, id) {
    let deferred = Q.defer();

    Category.findOne({_id: id}).then(category => {

        addItem(recipe.categories, category);

        recipe.save().then(() => {

            //console.log("added to rec", recipe.categories.length)

            //to add in the recipe reference
            deferred.resolve(find(recipe.categories, category));

        }).catch(reason => deferred.reject(reason));


    }).catch(reason => deferred.reject(reason));

    return deferred.promise;
}

function find(list, id) {

    return list.find(item => getValue(item) === getValue(id));
}

function getAttribute(recipe, ingredient) {

    let deferred = Q.defer();

    let ingredientId = ingredient._id;

    let recipeFlagSelected = ingredient.tempRecipeLinkIndicator;

    IngredientRecipeAttributes
        .findOne({recipeId: recipe._id, ingredientId: ingredientId})
        .then(attr => {

            if(!attr) {

                let attribute = new IngredientRecipeAttributes({
                    recipeId: recipe._id,
                    ingredientId: ingredientId,
                    name: recipe.name,
                    recipeFlagSelected: recipeFlagSelected
                });

                attribute.save().then(saved => {

                    deferred.resolve(saved);

                }).catch(reason => deferred.reject(reason));


            } else {

                attr.recipeFlagSelected = recipeFlagSelected;

                attr.save().then(() => {
                    deferred.resolve(attr);
                }).catch(reason => deferred.reject(reason));
            }

        }).catch(reason => deferred.reject(reason));


    return deferred.promise;
}

function saveInIngredient(ingredientId, attribute) {
    let deferred = Q.defer();

    //console.log("Save ingredi params " + ingredientId, attribute)

    Ingredient.findOne({_id: ingredientId})
        .then(ingredient => {

            addItem(ingredient.attributes, attribute);
//            console.log("INgredient " + ingredient.name)

            ingredient.save()
                .then(() => {
                    deferred.resolve(attribute);
                }).catch(reason => deferred.reject(reason));

        }).catch(reason => deferred.reject(reason));

    return deferred.promise;
}

function removeItem(list, pos) {

    return list.splice(pos, 1)
}


function handleResponse(res, doc, status) {
    res
        .status(status)
        .json(doc)
        .end();
}

function wmHandleError(res, reason) {
    log.errorExceptOnTest("handle error", reason.message);
    var errorResponse = {
        message : reason.message,
        name: reason.name,
        errors: reason.errors
    };

    res
        .status(400) //bad format
        .send(errorResponse)
        .end();
}

module.exports = router;
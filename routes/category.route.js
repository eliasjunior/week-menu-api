/**
 * Created by eliasmj on 03/12/2016.
 */

const router = require('express').Router();

const log = require('../utils/log.message');

const {Category} = require('../models/category.model');
const {Recipe} = require('../models/recipe.model');
const {IngredientRecipeAttributes} = require('../models/ingredient.recipe.attributes.model');

const Q = require('q');


router.get("/category/check/:recipeId", (request, response, next) => {

    //TODO need to write a test case for it
    //read /recipe/category comments
    Category.find()
        .populate('ingredients')
        .then(allCategories => {
            linkRecipeToIngredients(allCategories);

        }, (reason) => {
            wmHandleError(response, reason);
        });

        function linkRecipeToIngredients(allCategories){

            let countCat = allCategories.length;

            if(countCat === 0) {
                handleResponse(response, allCategories, 200);
            }

            Recipe.findOne({_id: request.params.recipeId})
                .populate('categories')
                .then(recipe => {

                    let recipeId = recipe._id;

                    allCategories.forEach(catFromAll => {

                        let countIngredient = catFromAll.ingredients.length;

                        //console.log("Counts in loop ", countCat, countIngredient)

                        if(countIngredient === 0) {

                            if(--countCat === 0) {
                                handleResponse(response, allCategories, 200);
                            }

                        } else {

                            catFromAll.ingredients.forEach(ingToBeSend => {
                                //console.log("CAt Name", catFromAll.name, ingToBeSend.name)
                                //reset always because virtual does not work!
                                ingToBeSend.tempRecipeLinkIndicator = false;

                                let ingredientId = ingToBeSend._id;

                                IngredientRecipeAttributes.findOne({recipeId, ingredientId}).then(attr => {

                                    if(attr) {
                                        ingToBeSend.tempRecipeLinkIndicator = attr.isRecipeLinkedToCategory;

                                        //console.log("attr", attr.name, recipe.name)

                                    } else {
                                        ingToBeSend.tempRecipeLinkIndicator = false
                                    }

                                    //console.log("Ingredient " + ingToBeSend.name, ingToBeSend.tempRecipeLinkIndicator)

                                    if(--countIngredient <= 0) {

                                        //console.log("Going!", countIngredient, countCat)
                                        if(--countCat === 0) {
                                            handleResponse(response, allCategories, 200);
                                        }
                                    }

                                });
                            });
                        }

                    });

                    // console.log("****** CAT UPDATED", categories)
                }).catch(reason => wmHandleError(response, reason));

        }
});

router.get("/category", (request, response, next) => {

    Category.find()
        .populate('ingredients')
        .sort({'name': 1})
        .then((categories) => {

            handleResponse(response, categories, 200);

        }, (reason) => {
            wmHandleError(response, reason);
        });
});


router.get("/category/week/shopping", (request, response, next) => {

    Category.find()
        .populate('ingredients')
        .then((docs) => {

            const options = {
                path: 'ingredients.attributes',
                model: 'IngredientRecipeAttributes',
                match: {itemSelectedForShopping: true, isRecipeLinkedToCategory: true}
            };

            Category.populate(docs, options).then(deep => {

                let categories = deep.filter(category => {

                    //filter based on the query above, if there didn't match any attribute the array is 0
                    let ingredients = category.ingredients.filter(ingredient => ingredient.attributes.length > 0);

                    category.ingredients = ingredients;

                    return category.ingredients.length > 0;

                });

                //filter by recipe in the week menu
                // categories = categories.filter(cat => {
                //     return cat.recipes.length > 0;
                // });


                handleResponse(response, categories, 200);
            }).catch(reason => wmHandleError(response, reason));
        }, (reason) => {
            wmHandleError(response, reason);
        });
});

router.get("/category/:id", (req, res, next) => {

    log.logExceptOnTest("category name", req.params.id);

    Category.findOne({_id: req.params.id})
        .then((doc) => {
            handleResponse(res, doc, 200);
        }, (reason) => {
            wmHandleError(res, reason);
        });

});

router.post('/category', (req, res, next) => {

    const request = req.body;

    const category = new Category({
        name : request.name
    });

    if(request.recipeId) {

        let tempRecipe = category.recipes.find(rec => rec._id.toString() === request.recipeId);

        if(!tempRecipe) {

            Recipe.findOne({_id: request.recipeId})
                .then(recipe => {

                    category.recipes.push(recipe);

                    saveCategory();

                });
        } else {
            saveCategory();
        }

    } else {
        saveCategory();
    }

    function saveCategory() {
        category.save()
            .then((doc) => {
                handleResponse(res, doc, 201);
            }, (reason) => {
                wmHandleError(res, reason);
            });
    }

});

router.put('/category', (req, res, next) => {
    // ** Concept status ** use 204 No Content to indicate to the client that
    //... it doesn't need to change its current "document view".

    let request = req.body;

    Category.findOne({_id: req.body._id})
        .populate('recipes')
        .then(category => {

            category.name = req.body.name;

            if(request.recipeId) {

                let tempRecipe = category.recipes.find(rec => rec._id.toString() === request.recipeId);

                if(!tempRecipe) {

                    //TODO repeated code /post
                    Recipe.findOne({_id: request.recipeId})
                        .then(recipe => {

                            category.recipes.push(recipe);

                            category.save()
                                .then(() => handleResponse(res, category, 204))

                        });
                } else {
                    category.save()
                        .then(() => handleResponse(res, category, 204))
                }

            } else {
                category.save()
                    .then(() => handleResponse(res, category, 204))
            }

        }, (reason) => {
            wmHandleError(res, reason);
        });
});

router.delete('/category', (req, res, next) => {

    Category.findByIdAndRemove(req.body._id)
        .then((doc) => {
            handleResponse(res, doc, 204);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});


function handleResponse(response, doc, status) {

    log.logExceptOnTest("Response Category Route ----");
    log.logExceptOnTest("Response doc", doc);

    response
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
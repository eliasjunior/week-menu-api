/**
 * Created by eliasmj on 03/12/2016.
 */
const router = require('express').Router();
const Q = require('q');

const log = require('../utils/log.message');

const {Ingredient} = require('../models/ingredient.model');
const {Category} = require('../models/category.model');
const {IngredientRecipeAttributes} = require('../models/ingredient.recipe.attributes.model');
const {Recipe} = require('../models/recipe.model');
const {_} = require('lodash');


router.get("/ingredient", (request, response, next) => {

    Ingredient.find()
        .then((docs) => {
            handleResponse(response, docs, 200);
        }, (reason) => {
            wmHandleError(response, reason);
        });

});

router.get("/ingredient/:id", (request, res, next) => {

    log.logExceptOnTest("ingredient name", request.params.id);

    Ingredient.findOne({_id: request.params.id})
        .then((doc) => {

            handleResponse(res, doc, 200);
        }, (reason) => {
            wmHandleError(res, reason);
        });

});

router.get("/ingredient/recipe/:ingredientId/:recipeId", (request, res, next) => {

    log.logExceptOnTest("params", request.params.ingredientId);
    log.logExceptOnTest("params", request.params.recipeId);

    IngredientRecipeAttributes.findOne({
        ingredientId:request.params.ingredientId,
        recipeId:request.params.recipeId
    })
    .then((doc) => {
       handleResponse(res, doc, 200);
    }, (reason) => {
       wmHandleError(res, reason);
    });

});

//FIXME deprecated ??
router.get("/ingredient/recipe/:recipeId", (request, res, next) => {

    log.logExceptOnTest("params", request.params.recipeId);

    IngredientRecipeAttributes.find({
        recipeId:request.params.recipeId
    }).then(doc => {

            handleResponse(res, doc, 200);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});

router.post('/ingredient', (request, res, next) => {

    let recipeId = null;
    if(_.has(request, 'body.ingredientRecipeAttributes.recipeId')) {
        recipeId = request.body.ingredientRecipeAttributes.recipeId;
    }

    //TODO need a stronger test case on it, its breaking too much
    validate(request)
        .then(saveIngredient)
        .then(saveAttribute)
        .then(findCategoryAndAddToIt.bind(null, recipeId))
        .then(ingredient => {
            handleResponse(res, ingredient, 201);
        }).catch((reason) => {
            wmHandleError(res, reason);
        });

    function saveIngredient(ingredientCommand) {

        let deferred = Q.defer();

        let ingredientRequest = request.body.ingredient;

        let ingredient = new Ingredient({
            name : ingredientRequest.name,
            _creator: ingredientRequest._creator,
            expiryDate: ingredientRequest.expiryDate,
            updateCheckDate: ingredientRequest.updateCheckDate,
            itemSelectedForShopping: ingredientRequest.itemSelectedForShopping,
            checkedInCartShopping: ingredientRequest.checkedInCartShopping
        });

        ingredient.save().then(doc => {

            let result = {
                ingredient: doc,
                ingredientCommand: ingredientCommand
            }

            deferred.resolve(result);

        }).catch(reason => deferred.reject(reason))


        return deferred.promise;
    }

    function validate(request) {

        let deferred = Q.defer();

        let errorResponse = getErrorResponse();

        if(!_.has(request, 'body')) {

            errorResponse.message = "No body found";
            errorResponse.reason = "No body"

            deferred.reject(errorResponse);

        } else if(!_.has(request, "body.ingredient")) {

            errorResponse.message = "no ingredient found";
            errorResponse.reason = "body wrong format";

            deferred.reject(errorResponse);

        } else if(!_.has(request, 'body.ingredient._creator') ) {

            errorResponse.message = "Missing category id";
            errorResponse.reason = "Id missing";

            deferred.reject(errorResponse);

        } else if(!_.has(request, 'body.ingredientRecipeAttributes')) {

            errorResponse.message = "Missing ingredientRecipeAttributes";
            errorResponse.reason = "ingredientRecipeAttributes missing";

            deferred.reject(errorResponse);

        } else {
            deferred.resolve(request.body);
        }

        return deferred.promise;
    }

    function saveAttribute(request) {

        let deferred = Q.defer();

        let ingredientId = request.ingredient._id;
        let attribute = request.ingredientCommand.ingredientRecipeAttributes;

        if(attribute) {

            Recipe.findOne({_id: attribute.recipeId})
                .then((recipe) => {

                    let ingredientRecipeAttributes = getAttribute(attribute, ingredientId, recipe.name);

                    //TODO *** quite old refactor hell
                    ingredientRecipeAttributes.save()
                        .then((doc) => {

                            Ingredient.findOne({_id: ingredientId})
                                .then(ingredient => {

                                    ingredient.attributes.push(doc);

                                    ingredient.save()
                                        .then( () => {

                                            recipe.attributes.push(doc);

                                            recipe.save()
                                                .then(() => {

                                                    deferred.resolve(request.ingredient);

                                                }).catch(reason => deferred.reject(reason));

                                        }).catch(reason => deferred.reject(reason));
                                });

                        }).catch(reason => deferred.reject(reason));
                });

        } else {
            //TODO SHOULD create one, get the functions getAttribute from recipe.route
            deferred.resolve({});
        }

        return deferred.promise;
    }


});

router.put('/ingredient', (request, res, next) => {
    // ** Concept status ** use 204 No Content to indicate to the client that
    //... it doesn't need to change its current "document view".

    let ingredientCommand = request.body;

    let recipeId = null;

    //console.log("REQUEST UPDATE LODASH has", _.has(ingredientCommand, 'ingredientRecipeAttributes.recipeId'))

    if(_.has(ingredientCommand, 'ingredientRecipeAttributes.recipeId')) {
        recipeId = ingredientCommand.ingredientRecipeAttributes.recipeId;
    }

    if(ingredientCommand.ingredientRecipeAttributes) {

        updateIngredient(ingredientCommand)
            .then(updateAttributes)
            .then(findCategoryAndAddToIt.bind(null, recipeId))
            .then(doc => {

                handleResponse(res, doc, 204);
            })
            .catch(reason => wmHandleError(res, reason));

    } else {
         updateIngredient(ingredientCommand)
             .then(resultChain => {
                findCategoryAndAddToIt(recipeId, resultChain.ingredient)
                    .then(doc =>  handleResponse(res, doc, 204));
             })
             .catch(reason => wmHandleError(res, reason));
    }


    function updateIngredient(ingredientCommand) {

        let deferred = Q.defer();
        let resultChain = {
            ingredient: ingredientCommand.ingredient,
            ingredientRecipeAttributes:  ingredientCommand.ingredientRecipeAttributes,
        }

        Ingredient.findOneAndUpdate({_id: ingredientCommand.ingredient._id}, ingredientCommand.ingredient)
            .then(() => {

                deferred.resolve(resultChain);

            }, (reason) => deferred.reject(reason));

        return deferred.promise;
    }

    function updateAttributes(resultChain) {
        let deferred = Q.defer();

        let attributesRequest = resultChain.ingredientRecipeAttributes;

        if(attributesRequest._id) {

            IngredientRecipeAttributes.findOneAndUpdate({_id: attributesRequest._id}, attributesRequest)
                .then(() => {

                    deferred.resolve(resultChain.ingredient);
                }).catch(reason => deferred.reject(reason));

        } else {

            //Workaround to index unique bug, discriminators
            //name: 'attributes_'+new Date().getTime()
            let ingredientRecipeAttributes = getAttribute(attributesRequest);

            ingredientRecipeAttributes.save()
                .then(() => {
                    deferred.resolve(resultChain.ingredient);
                }).catch(reason => deferred.reject(reason));
        }

        return deferred.promise;
    }


});

router.put('/ingredient/attribute', (request, response, next) => {

    let attributeUpdate = request.body;

    IngredientRecipeAttributes.findOneAndUpdate({_id: attributeUpdate._id}, attributeUpdate)
        .then(doc => {
            handleResponse(response, doc, 204);
        }).catch(reason => wmHandleError(res, reason));
});

router.put('/ingredient/attribute/many', (request, response, next) => {

    let attributeList = request.body;

    let asyncIteration = attributeList.length;

    if(asyncIteration === 0) {
        handleResponse(response, {}, 204);
    } else {

        attributeList.forEach(attribute => {
            IngredientRecipeAttributes.findOneAndUpdate({_id: attribute._id}, attribute)
                .then(doc => {

                    if(--asyncIteration === 0) {
                        handleResponse(response, doc, 204);
                    }

                }).catch(reason => wmHandleError(response, reason));
        });
    }

});

router.delete('/ingredient', (request, res, next) => {

    Ingredient.findByIdAndRemove(request.body._id)
        .then((doc) => {
            handleResponse(res, doc, 204);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});

function getAttribute(attributesRequest, ingredientId, recipeName) {

    return  new IngredientRecipeAttributes({
        labelQuantity: attributesRequest.labelQuantity,
        quantity: attributesRequest.quantity,
        ingredientId: ingredientId ? ingredientId : attributesRequest.ingredientId,
        recipeId: attributesRequest.recipeId,
        itemSelectedForShopping: attributesRequest.itemSelectedForShopping,
        name: recipeName
    });
}

//Add Ingredient to category, category.ingredients.push
//and add category to Recipe recipe.categories.push
function findCategoryAndAddToIt(recipeId, ingredient) {

    let deferred = Q.defer();

    if(!recipeId) {
        deferred.reject({message: "recipeId not sent"});
        return deferred.promise;
    }

    Category.findOne({_id: ingredient._creator})
        .populate('ingredients')
        .then(cat => {

            let tempIngredient = cat.ingredients.find(ing => ingredient._id.toString() === ing._id.toString())

            if(tempIngredient === undefined) {
                cat.ingredients.push(ingredient);
            }

            //TODO refactor, maybe change to category post
            cat.save()
                .then( doc => {

                    //need to add to recipe cat array
                    Recipe.findOne({_id: recipeId}).then(recipe => {

                        if(recipe) {

                            addItem(recipe.categories, cat);

                            recipe.save().then(() => {

                                deferred.resolve(ingredient);

                            }).catch(reason => deferred.reject(reason));
                        } else {

                            deferred.reject({message: "Not recipe found to add the category"})
                        }

                    }).catch(reason => deferred.reject(reason));

                }).catch(reason => deferred.reject(reason));

        }).catch(reason => {
             deferred.reject(reason)
        });

    return deferred.promise;
}


function handleResponse(response, doc, status) {

    log.logExceptOnTest("Response Ingredient Route ----");
    log.logExceptOnTest("Response doc", doc);

    response
        .status(status)
        .json(doc)
        .end();
}

function wmHandleError(res, reason) {

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

function getErrorResponse() {
    var errorResponse = {
        message : null,
        name: null,
        errors: null
    };

    return errorResponse;
}

//TODO move to utils
//Should return a list?
function addItem(list, item) {

    let tempItem = list.find(itemIn => {

        return getValue(itemIn) === getValue(item);
    });

    if(!tempItem) {
        list.push(item);
        return true;
    } else {
        return false;
    }
}

function getValue(value) {

    return value['_id'] !== undefined ? value._id.toString() : value.toString();

}



module.exports = router;
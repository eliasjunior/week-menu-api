/**
 * Created by eliasmj on 03/12/2016.
 */
const router = require('express').Router();
const Q = require('q');

const log = require('../utils/log.message');

const {Ingredient} = require('../models/ingredient.model');
const {Category} = require('../models/category.model');
const {IngredientRecipeAttributes} = require('../models/ingredient.recipe.attributes.model');
const {Recipe} = require('../models/recipe.model')

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

    validate(request)
        .then(saveIngredient)
        .then(saveAttributes)
        .then(findCategoryAndAddToIt)
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

        ingredient.save().then((doc) => {

            let result = {
                ingredient: doc,
                ingredientCommand: ingredientCommand
            }

            deferred.resolve(result);

        }).catch(reason => deferred.reject(reason))


        return deferred.promise;
    }

    function saveAttributes(result) {

        let deferred = Q.defer();

        let ingredientId = result.ingredient._id;
        let attributes = result.ingredientCommand.ingredientRecipeAttributes;

        if(attributes) {

            let ingredientRecipeAttributes = getAttributes(attributes, ingredientId);

            //TODO refactor hell
            ingredientRecipeAttributes.save()
                .then((doc) => {

                    Ingredient.findOne({_id: ingredientId})
                        .then(ingredient => {

                            ingredient.attributes.push(doc);

                            ingredient.save().then( () => {

                                Recipe.findOne({_id: ingredientRecipeAttributes.recipeId})
                                    .then((recipe) => {

                                        recipe.attributes.push(doc);

                                        recipe.save()
                                            .then(() => {
                                                deferred.resolve(result.ingredient);
                                            });
                                    });
                            });
                        });

                }).catch(reason => deferred.reject(reason));

        } else {
            deferred.resolve({});
        }

        return deferred.promise;
    }



    function validate(request) {

        let deferred = Q.defer();

        let ingredientCommand = request.body.ingredient;

        if(!request.body) {

            let errorResponse = getErrorResponse();

            errorResponse.message = "No body found";
            errorResponse.reason = "No body"

            deferred.reject(errorResponse);
        } else if(!request.body.hasOwnProperty("ingredient")) {

            let errorResponse = getErrorResponse();

            errorResponse.message = "no ingredient attribute found";
            errorResponse.reason = "body wrong format"

            deferred.reject(errorResponse);

        } else  if(!ingredientCommand.hasOwnProperty("_creator")) {

            let errorResponse = getErrorResponse();

            errorResponse.message = "Missing category id";
            errorResponse.reason = "Id missing"

            deferred.reject(errorResponse);

        } else {
            deferred.resolve(request.body);
        }

        return deferred.promise;
    }
});

router.put('/ingredient', (request, res, next) => {
    // ** Concept status ** use 204 No Content to indicate to the client that
    //... it doesn't need to change its current "document view".

    let ingredientCommand = request.body;

    if(ingredientCommand.ingredientRecipeAttributes) {

        updateIngredient(ingredientCommand)
            .then(updateAttributes)
            .then(findCategoryAndAddToIt)
            .then(doc => {
                handleResponse(res, doc, 204)
            })
            .catch(reason => wmHandleError(res, reason));

    } else {
         updateIngredient(ingredientCommand)
             .then(doc => {
                findCategoryAndAddToIt(doc.doc)
                    .then(doc =>  handleResponse(res, doc, 204));
             })
             .catch(reason => wmHandleError(res, reason));
    }


    function updateIngredient(ingredientCommand) {

        let deferred = Q.defer();
        let result = {
            ingredientCommand: ingredientCommand,
            doc: null
        }

        Ingredient.findOneAndUpdate({_id: ingredientCommand.ingredient._id}, ingredientCommand.ingredient)
            .then(() => {

                result.doc = ingredientCommand.ingredient;

                deferred.resolve(result);

            }, (reason) => deferred.reject(reason));

        return deferred.promise;
    }

    function updateAttributes(result) {
        let deferred = Q.defer();

        let attributesRequest = result.ingredientCommand.ingredientRecipeAttributes;

        if(attributesRequest._id) {

            IngredientRecipeAttributes.findOneAndUpdate({_id: attributesRequest._id}, attributesRequest)
                .then(() => {
                    deferred.resolve(result.doc);
                }).catch(reason => deferred.reject(reason));

        } else {

            //Workaround to index unique bug, discriminators
            //name: 'attributes_'+new Date().getTime()
            let ingredientRecipeAttributes = getAttributes(attributesRequest);

            ingredientRecipeAttributes.save()
                .then(() => {
                    deferred.resolve(result.doc);
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


function getAttributes(attributesRequest, ingredientId) {

    return  new IngredientRecipeAttributes({
        labelQuantity: attributesRequest.labelQuantity,
        quantity: attributesRequest.quantity,
        ingredientId: ingredientId ? ingredientId : attributesRequest.ingredientId,
        recipeId: attributesRequest.recipeId,
        itemSelectedForShopping: attributesRequest.itemSelectedForShopping,
        name: 'attributes_'+new Date().getTime()
    });

}

function findCategoryAndAddToIt(ingredient) {

    let deferred = Q.defer();

    Category.findOne({_id: ingredient._creator})
        .then((cat) => {

            cat.ingredients.push(ingredient);

            cat.save()
                .then( doc => deferred.resolve(ingredient))
                .catch(reason => deferred.reject(reason));

        }).catch(reason => {
             deferred.reject(reason)
        });

    return deferred.promise;
}



function handleResponse(response, doc, status) {
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

function getErrorResponse() {
    var errorResponse = {
        message : null,
        name: null,
        errors: null
    };

    return errorResponse;
}


module.exports = router;
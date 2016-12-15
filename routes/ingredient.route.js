/**
 * Created by eliasmj on 03/12/2016.
 */
const router = require('express').Router();
const Q = require('q');

const log = require('../utils/log.message');

const {Ingredient} = require('../models/ingredient.model');
const {Category} = require('../models/category.model');
const {IngredientRecipe} = require('../models/ingredient.recipe.model');

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

    IngredientRecipe.findOne({
        ingredientId:request.params.ingredientId,
        recipeId:request.params.recipeId
    })
    .then((doc) => {
       handleResponse(res, doc, 200);
    }, (reason) => {
       wmHandleError(res, reason);
    });

});

router.post('/ingredient', (request, res, next) => {

    validate(request)
        .then(saveIngredient)
        .then(saveAttributes)
        .then(findCategoryAndPopulate)
        .then(ingredient => {
            handleResponse(res, ingredient, 201);
        }).catch((reason) => {
            wmHandleError(res, reason);
        });

    function saveIngredient(ingredientCommand) {

        let deferred = Q.defer();

        let ingredientRequest = request.body.ingredient;

        var ingredient = new Ingredient({
            name : ingredientRequest.name,
            _creator: ingredientRequest._creator,
            expiryDate: ingredientRequest.expiryDate,
            updateCheckDate: ingredientRequest.updateCheckDate,
            itemSelectedForShopping: ingredientRequest.itemSelectedForShopping,
            checkedInCartShopping: ingredientRequest.checkedInCartShopping,
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
        let attributes = result.ingredientCommand.ingredientRecipe;

        if(attributes) {

            let ingredientRecipe = new IngredientRecipe({
                labelQuantity: attributes.labelQuantity,
                ingredientId: ingredientId,
                recipeId: attributes.recipeId,
                name: 'attributes_' + new Date().getTime()
            });

            ingredientRecipe.save()
                .then(() => {

                    deferred.resolve(result.ingredient);

                }).catch(reason => deferred.reject(reason));

        } else {
            deferred.resolve({});
        }

        return deferred.promise;
    }

    function findCategoryAndPopulate(ingredient) {

        let deferred = Q.defer();

        Category.findOne({_id: ingredient._creator})
            .then((cat) => {

                cat.ingredients.push(ingredient);

                cat.save()
                    .then( doc => deferred.resolve(ingredient))
                    .catch(reason => deferred.reject(reason));

             }).catch(reason => deferred.reject(reason));

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

    let ingredientUpdate = {
        name : ingredientCommand.name,
        _creator: ingredientCommand._creator,
        expiryDate: ingredientCommand.expiryDate,
        updateCheckDate: ingredientCommand.updateCheckDate,
        itemSelectedForShopping: ingredientCommand.itemSelectedForShopping,
        checkedInCartShopping: ingredientCommand.checkedInCartShopping,
        ingredientRecipe: ingredientCommand.ingredientRecipe,
        _id: ingredientCommand._id
    };

    if(ingredientCommand.ingredientRecipe) {

         let ingredientRecipeCommand = ingredientCommand.ingredientRecipe;

        //Workaround to index unique bug, discriminators
        //name: 'attributes_'+new Date().getTime()
         let ingredientRecipe = new IngredientRecipe({
             labelQuantity: ingredientRecipeCommand.labelQuantity,
             ingredientId: ingredientRecipeCommand.ingredientId,
             recipeId: ingredientRecipeCommand.recipeId,
             name: 'attributes_'+new Date().getTime()
         });

         //TODO refactor here, manipulate the result to the callback
        updateIngredient(ingredientUpdate)
            .then((docParent) => {

                ingredientRecipe.save()
                    .then(() => {

                        handleResponse(res, docParent, 204);

                    }).catch(reason => {
                        wmHandleError(res, reason);
                     });

            }).catch(reason => {
                wmHandleError(res, reason);
            });

    } else {

         updateIngredient(ingredientUpdate)
             .then((doc) => handleResponse(res, doc, 204) )
             .catch(reason => {
                 wmHandleError(res, reason);
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

function updateIngredient(ingredientUpdate) {

    let deferred = Q.defer();

    Ingredient.findOneAndUpdate({_id: ingredientUpdate._id}, ingredientUpdate)
        .then((doc) => {

            deferred.resolve(doc);

        }, (reason) => deferred.reject(reason));

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
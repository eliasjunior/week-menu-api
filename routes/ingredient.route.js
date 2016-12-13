/**
 * Created by eliasmj on 03/12/2016.
 */
const router = require('express').Router();

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

    console.log("params", request.params.ingredientId);
    console.log("params", request.params.recipeId);

    IngredientRecipe.find({}).then(docs => console.log(">>>>>>", docs))

    IngredientRecipe.findOne({
        ingredientId:request.params.ingredientId,
        recipeId:request.params.recipeId
    })
    .then((doc) => {

        console.log("found", doc)

       handleResponse(res, doc, 200);
    }, (reason) => {
       wmHandleError(res, reason);
    });

});

router.post('/ingredient', (request, res, next) => {

    if( !request.body.hasOwnProperty("_creator")) {
        var errorResponse = getErrorResponse();

        errorResponse.message = "Missing category id";
        errorResponse.reason = "Id missing"

        wmHandleError(res, errorResponse);

        return
    }

    let ingredientCommand = request.body;

    var ingredient = new Ingredient({
        name : ingredientCommand.name,
        _creator: ingredientCommand._creator,
        expiryDate: ingredientCommand.expiryDate,
        updateCheckDate: ingredientCommand.updateCheckDate,
        itemSelectedForShopping: ingredientCommand.itemSelectedForShopping,
        checkedInCartShopping: ingredientCommand.checkedInCartShopping,
    });

    ingredient.save()
        .then((doc) => {

            Category.findOne({_id: ingredient._creator})
                .then((cat) => {
                    cat.ingredients.push(doc);
                    cat.save()
                        .then(() => {
                            //console.log("cat pushed ingredietn");
                            handleResponse(res, doc, 201);
                        }).catch((reason) => {
                            console.error("Error to update category ingredients list");
                            wmHandleError(res, reason);
                        });
                }).catch((reason) => {
                    console.error("Error to load category to update the ingredient list");
                    wmHandleError(res, reason);
                });

        }, (reason) => {
            wmHandleError(res, reason);
        });
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
        ingredientRecipe: ingredientCommand.ingredientRecipe
    };

     if(ingredientCommand.ingredientRecipe) {

         let ingredientRecipeCommand = ingredientCommand.ingredientRecipe;

         let ingredientRecipe = new IngredientRecipe({
             labelQuantity: ingredientRecipeCommand.labelQuantity,
             ingredientId: ingredientRecipeCommand.ingredientId,
             recipeId: ingredientRecipeCommand.recipeId
         });

         ingredientRecipe.save()
             .then(docSaved => {

                updateIngredient(ingredientCommand._id, ingredientUpdate, res);

             }).catch(reason => {
                 console.error(reason)
                 wmHandleError(res, reason);
             });

     } else {

         updateIngredient(ingredientCommand._id, ingredientUpdate, res);
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

function updateIngredient(id, ingredientUpdate, res) {

    Ingredient.findOneAndUpdate({_id: id}, ingredientUpdate)
        .then((doc) => {
            handleResponse(res, doc, 204);
        }, (reason) => {
            wmHandleError(res, reason);
        });
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
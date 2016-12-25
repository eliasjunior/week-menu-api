/**
 * Created by eliasmj on 03/12/2016.
 */

const router = require('express').Router();

const log = require('../utils/log.message');

const {Category} = require('../models/category.model');
const {Recipe} = require('../models/recipe.model');


router.get("/category/check/:recipeId", (request, response, next) => {

    Category.find()
        .populate('ingredients')
        .then(categories => {
            linkRecipeToIngredients(categories);

        }, (reason) => {
            wmHandleError(response, reason);
        });

        function linkRecipeToIngredients(categories){

            Recipe.findOne({_id: request.params.recipeId})
                .populate('categories')
                .then(recipe => {

                    let options = {
                        path: 'categories.ingredients',
                        model: 'Ingredient'
                    };

                    Recipe.populate(recipe, options)
                        .then(deepRecipe => {

                           // console.log("****** REC DEEP ", categories)

                            categories.forEach(cat => {

                                cat.ingredients.forEach(ingToBeSend => {

                                    deepRecipe.categories.forEach(recCategory => {
                                        let recipe = recCategory.ingredients.find(recipeIngredient => recipeIngredient._id = ingToBeSend._id)

                                        if(recipe){
                                            ingToBeSend.tempRecipeLinkIndicator = true;



                                           // console.log("ing to send", ing);
                                           // console.log("******************", ing.tempRecipeLinkIndicator);
                                        }

                                    });
                                });
                            });

                            handleResponse(response, categories, 200);
                        });

                   // console.log("****** CAT UPDATED", categories)



                }).catch(reason => wmHandleError(response, reason));
        }
});

router.get("/category", (request, response, next) => {

    Category.find()
        .populate('ingredients')
        .then((categories) => {

            handleResponse(response, categories, 200);

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

    var category = new Category({
        name : req.body.name
    });

    category.save()
        .then((doc) => {
            handleResponse(res, doc, 201);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});

router.put('/category', (req, res, next) => {
    // ** Concept status ** use 204 No Content to indicate to the client that
    //... it doesn't need to change its current "document view".
    Category.findOneAndUpdate({_id: req.body._id}, req.body)
        .then((doc) => {
            handleResponse(res, doc, 204);
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
/**
 * Created by eliasmj on 26/11/2016.
 */
var express = require('express');
var router = express.Router();

const log = require('../utils/log.message');

var {Recipe} = require('../models/recipe.model');

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

    Recipe.findOneAndUpdate({_id: recipeCommand._id}, recipeCommand)
        .then((docUpdated) => {

            handleResponse(res, docUpdated, 204);
        }, (reason) => {
            wmHandleError(res, reason);
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

router.get("/recipe/category/:id", (req, response, next) => {

    Recipe
        .findOne({_id: req.params.id})
        .populate('categories')
        .then((populated) => {

            var options = {
                path: 'categories.ingredients',
                model: 'Ingredient'
            };

            Recipe.populate(populated,options)
                .then(deepPopulated => {
                 // console.log("deep docSaved", deepPopulated.categories);

                    handleResponse(response, deepPopulated, 200);

                }).catch( (reason) => {
                wmHandleError(response, reason);
            });

        }, (reason) => {
            wmHandleError(response, reason);
        });
});

router.put("/recipe/category", (request, response, next) => {

    Recipe
        .findOne({_id: request.body._id})
        .then(recipe => {

            let categories = request.body.categories;

            categories.forEach((cat) => {
                recipe.categories.push(cat);
            });

            recipe.save()
                .then((docSaved) => {
                    handleResponse(response, docSaved, 204);

                }).catch( (reason) => {
                    wmHandleError(response, reason);
                });

        }, (reason) => {
            wmHandleError(response, reason);
        });
});


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
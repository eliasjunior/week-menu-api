/**
 * Created by eliasmj on 03/12/2016.
 */
const router = require('express').Router();

const log = require('../utils/log.message');

var {Ingredient} = require('../models/ingredient.model.js');

router.get("/ingredient", (request, response, next) => {

    Ingredient.find()
        .then((docs) => {
            handleResponse(response, docs, 200);
        }, (reason) => {
            wmHandleError(response, reason);
        });

});

router.get("/ingredient/:id", (req, res, next) => {

    log.logExceptOnTest("ingredient name", req.params.id);

    Ingredient.findOne({_id: req.params.id})
        .then((doc) => {
            handleResponse(res, doc, 200);
        }, (reason) => {
            wmHandleError(res, reason);
        });

});

router.post('/ingredient', (req, res, next) => {

    var ingredient = new Ingredient({
        name : req.body.name
    });

    ingredient.save()
        .then((doc) => {
            handleResponse(res, doc, 201);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});

router.put('/ingredient', (req, res, next) => {
    // ** Concept status ** use 204 No Content to indicate to the client that
    //... it doesn't need to change its current "document view".
    Ingredient.findOneAndUpdate({_id: req.body._id}, req.body)
        .then((doc) => {
            handleResponse(res, doc, 204);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});

router.delete('/ingredient', (req, res, next) => {

    Ingredient.findByIdAndRemove(req.body._id)
        .then((doc) => {
            handleResponse(res, doc, 204);
        }, (reason) => {
            wmHandleError(res, reason);
        });
});


function handleResponse(res, doc, status) {
    res
        .status(status)
        .json(doc)
        .end();
}

function wmHandleError(res, reason) {
    log.errorExceptOnTest("handle error", reason.essage);
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
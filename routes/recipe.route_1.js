/**
 * Created by eliasmj on 15/08/2016.
 */

(function () {
    'use strict'

    var express = require('express');
    var router = express.Router();

    var Recipes = require('../models/recipe.model').recipe();

    router.get("/recipe", list);
    router.get("/recipe/:id", load);
    router.post("/recipe", save);
    router.put("/recipe/:id", update);
    router.delete("/recipe/:id", _delete);

    function list(req, res, next){

        Recipes.find(function(err, doc){

            console.log("List length", doc.length);

            //res.send(JSON.stringify(doc));
            res.json(doc);
        });
    }

    function load(req, res, next) {

        console.log("Load id", req.params.id)

        Recipes.findOne(function (err, doc) {

            var itemRequired = null;
            doc.recipes.forEach(function (item) {
                if(item._id && item._id.toString() === req.params.id.toString()) {
                    itemRequired = item;
                }
            });

            res.json(itemRequired);
        });


        // Recipes.findById(req.params.id, function(err, doc){
        //     res.json(doc);
        // });
    }

    function save(req, res, next) {

        console.log("Save ", req.body)

        Recipes.findOne(function (err, doc) {

            if(err) {
                throw err;
            }

            doc.recipes.push(req.body);
            doc.markModified();

            doc.save(function(errIn){
                if(errIn) {
                    throw errIn;
                }
                res.end();
            });
        });
    }

    function update(req, res, next) {

        console.log("Update id", req.params.id)

        Recipes.findOne(function (err, doc) {

            doc.recipes.pull({_id : req.params.id});

            var recipeUpdate = req.body;
            recipeUpdate._id = req.params.id;

            //add new one
            doc.recipes.push(req.body);

            doc.markModified();

            doc.save(function(errIn){
                if(errIn) {
                    throw errIn;
                }
                res.end();
            });
           // doc.recipes.set()
        });

        // Recipes.findOneAndUpdate(req.params.id, req.body, function(err, recipe){
        //     if(err) {
        //         console.error("Update error", recipe, err);
        //         return next(err)
        //     } else {
        //         res.end();
        //     }
        // });
    }

    function _delete(req, res, next) {

        console.log("Remove doc", req.params.id);

        Recipes.findOne(function (err, doc) {

            doc.recipes.pull({_id : req.params.id});

            doc.markModified();

            doc.save(function(errIn){
                if(errIn) {
                    throw errIn;
                }
                res.end();
            });
        });

        // Recipes.findByIdAndRemove(req.params.id, function(err) {
        //     if(err) {
        //         throw err;
        //     }
        //     res.end();
        // });

    }

    module.exports = router;

})();

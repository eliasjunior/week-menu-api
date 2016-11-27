/**
 * Created by eliasmj on 26/11/2016.
 */
var express = require('express');
var router = express.Router();

router.get("/recipe", (req, res, next) => {
    res.json([]);
});

router.get("/recipe/:id", (req, res, next) => {

    console.log("Recipe id", req.params.id)

    res.json({});
});

router.post('/recipe', (req, res, next) => {
    res
        .status(201)
        .end();
});

router.put('/recipe', (req, res, next) => {
    //use 204 No Content to indicate to the client that
    // it doesn't need to change its current "document view".
    res
        .status(204)
        .end();
});

router.delete('/recipe', (req, res, next) => {
    res.end();
});

module.exports = router;
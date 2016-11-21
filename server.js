/**
 * Created by eliasmj on 23/07/2016.
 *
 * *** npm run dev >>> runs nodemon to reload the file without restart the server
 */

(function () {
    'use strict'

    var express = require('express');

    var app = express();

    var bodyParser = require('body-parser');

    var mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost/week_menu');

    var db = mongoose.connection;
    var myLogger = function(req, res, next) {

        console.log("My Middleware LOGGER", req.body)
        next();
    }
    var recipeRouter = require('./routes/recipe.route');

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function() {
       console.log("DB connection is opened!")
    });
    app.use(bodyParser.json());

    // Create application/x-www-form-urlencoded parser
    app.use(bodyParser.urlencoded({ extended: true }))


    app.use(express.static('public'));

    app.use(myLogger);

    //my route middleware
    app.use('/', recipeRouter);

    // app.post("/", bodyParser.urlencoded({ extended: true }), function(req, resp){
    //
    //     var response = {
    //         first_name : req.body.first_name,
    //         last_name: req.body.last_name
    //     }
    //     resp.end(JSON.stringify(response));
    // });

    //test delete
    app.delete("/", function(req, response){
        response.send("hey mom I'm coming ")
    })


    var server = app.listen(3001, function() {
        var host = server.address().address
        var port = server.address().port

        console.log("Example app listening at http://%s:%s", host, port)
    });

    var errorHandle = function(err, req, res, next){

        console.error(err.stack);

        res.status(500).send("Error in the back brow!")

    }

    app.use(errorHandle);

})();

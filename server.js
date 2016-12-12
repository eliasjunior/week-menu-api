/**
 * Created by eliasmj on 24/11/2016.
 *
 * *** npm run dev >>> runs nodemon to reload the file without restart the server
 */
require('./config/config');

const log = require('./utils/log.message');

var app = require('express')();

var db  = require('./db/mongoose');

var bodyParser = require('body-parser');

var logger = function(request, response, next) {
    log.errorExceptOnTest("Request body", request.body);
    log.errorExceptOnTest("Request Path", request.path);
    next();
}

const recipeRouter = require('./routes/recipe.route');
const ingredientRouter = require('./routes/ingredient.route');
const categoryRouter = require('./routes/category.route');

app.use(bodyParser.json());
// Create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: true }));

//allow cross-origin to my ionic local host
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8100');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
}

app.use(allowCrossDomain);
app.use(logger);

app.use('/', recipeRouter);
app.use('/', ingredientRouter);
app.use('/', categoryRouter);

app.use(errorHandle);

app.get('/', (req, res) => {
    res.send("Root api")
});

db.connection.on('error', () => {
    log.errorExceptOnTest('Oops Something went wrong, connection error:');
});

db.connection.once('open', () => {
    log.logExceptOnTest("MongoDB successful connected");
});

const port = process.env.PORT;

app.listen(port, () => {
    log.logExceptOnTest("Application started. Listening on port:" + port);
});


function errorHandle(err, req, res, next){

    log.errorExceptOnTest(err.stack);
    var errorResponse = {
        message : "Error happened in the back",
        name: "Main error",
        errors: []
    };

    res
        .status(500) //bad format
        .send(errorResponse)
        .end();
}

// if(!module.parent){
//     app.listen(port, () => {
//         console.log("Application started. Listening on port:" + port);
//     });
// }

module.exports = { app : app};
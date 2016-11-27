/**
 * Created by eliasmj on 24/11/2016.
 */

var app = require('express')();

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/week_menu');

var bodyParser = require('body-parser');

var recipeRouter = require('./routes/recipe.route');

app.use(bodyParser.json());
// Create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
    res.send("testing")
});

const port = process.env.PORT || 3000;

if(!module.parent){
    app.listen(port, () => {
        console.log("Application started. Listening on port:" + port);
    });
}

app.use('/', recipeRouter);

module.exports = { app : app};
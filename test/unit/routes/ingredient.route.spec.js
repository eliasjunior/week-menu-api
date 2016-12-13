/**
 * Created by eliasmj on 03/12/2016.
 */

const request = require("supertest");
const expect = require("expect");

const app = require('../../../server').app;

const {Ingredient} = require('../../../models/ingredient.model');
const {Category} = require('../../../models/category.model');
const {Recipe} = require('../../../models/recipe.model');
const {IngredientRecipe} = require('../../../models/ingredient.recipe.model');

var categories = [
    {name : "categoryTest"},
    {name : "categoryTest1"}
]

var Q = require('q');

var ingredientTestName = 'ingredient name test';

beforeEach((done) => {

    Category.remove({})
        .then(insertManyCat)

    function insertManyCat() {

        IngredientRecipe.remove({})
            .then(removedIngredient)
            .then(insertManyCategory)
            .then(saveRecipe)
            .then(saveIngredients)
            .then(saveAttributesRecipes)


        function removedIngredient() {

            return Ingredient.remove({})
        }

        function insertManyCategory() {

            let result = {docs : null, recId: null};

            let deferred = Q.defer();

            Category
                .insertMany(categories)
                .then(docs => {

                    result.docs = docs;

                    deferred.resolve(result);

                }).catch((reason) => deferred.reject(reason))

            return deferred.promise;

        }

        function saveIngredients(result) {
            let results = {
                ingredientIds : [],
                recipeId: result.recId
            }

            let deferred = Q.defer();

            let count = 0;

            result.docs.forEach(function(item, index){

                let ingredient = new Ingredient({
                    name : ingredientTestName + index,
                    _creator :  item._id
                });

                ingredient.save()
                    .then((ing) => {

                    results.ingredientIds.push(ing._id)

                    if(++count === 2) {
                        deferred.resolve(results);
                    }
                })
            })

           return deferred.promise;
        }

        function saveAttributesRecipes(results) {
            IngredientRecipe.remove({})
                .then(() => {

                    let ingRecipe = new IngredientRecipe({
                        labelQuantity: 'kg',
                        name: 'porcaria',
                        ingredientId: results.ingredientIds[0],
                        recipeId: results.recId
                    })

                    ingRecipe.save().then(docIngR => { done() });
                   // done()
                   // console.log("RESULTS", results)
                })
                .catch(reason => done())
        }

        function saveRecipe(result) {

            let deferred = Q.defer();

            Recipe.remove({})
                .then(docR => {

                    let recipe = new Recipe({
                        name: 'recipe_test_ingredients'
                    });

                    recipe.save().then(docRec => {

                        result.recId = docRec._id;

                        deferred.resolve(result);

                    }).catch(reason => deferred.reject(reason))


                })

            return deferred.promise;

        }
    }
});

describe("Ingredient", () => {

    it("should get ingredient list", (done) => {

        request(app)
            .get('/ingredient')
            .expect(200)
            .expect((res) => {
                expect(res.body.length).toBe(2);
            })
            .end(done);

    });

    it('should load ingredient by passing an Id', (done) => {

        var ingredient = new Ingredient({
            name : 'ingredient name test',
        })

        ingredient.save()
            .then((doc) => {

                request(app)
                    .get('/ingredient/' + doc._id)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body._id).toBe(doc._id.toString())
                    }).end(done)
            });
    });

    it('should load ingredient/attributes', (done) => {

        loadIdsToRecAttributes()
            .then( result => {

                request(app)
                    .get('/ingredient/recipe/'+result.ingredientId+"/"+result.recipeId)
                    .expect(200)
                    .expect((res) => {

                        let ingredientRecipe = res.body;

                        expect(ingredientRecipe.ingredientId).toBe(result.ingredientId);
                        expect(ingredientRecipe.recipeId).toBe(result.recipeId);
                    }).end(done)

            });
    });

    it("should save a ingredient", (done) => {

        Category.find({})
            .then( (docs) => {

                let categoryId = docs[0]._id;

                let ingredient = {
                    name : 'testname ingredient',
                    _creator : categoryId
                };

                request(app)
                .post('/ingredient')
                .send(ingredient)
                .expect(201)
                .end((err, res) => {

                    if (err) throw err;

                    let id = res.body._id;

                    Ingredient.findOne({_id: id})
                    .then((doc) => {

                        expect(res.body).toIncludeKey('_id');
                        expect(doc._creator).toEqual(categoryId);

                        Category
                            .findOne({_id: categoryId})
                            .populate('ingredients')
                            .then( (cat) => {
                                expect(cat.ingredients.length).toBe(1)
                                done()
                            }). catch((reason) => {
                            done(reason)
                        });

                    }).catch((reason) => {
                            done(reason)
                    });
                   // addRecipeToIngredient(res, done);
                });
            });
    });

    it("should fail to save/post a ingredient", (done) => {

        request(app)
            .post('/ingredient')
            .expect(400)
            .expect((res) => {
                expect(res.body).toIncludeKeys(['message', 'errors', 'name']);

                Ingredient.find({})
                    .then((docs) => {

                        expect(docs.length).toBe(2);

                    }).catch((reason) => {
                        return reason
                    });
            })
            .end(done);

    });

    it("should fail to save/post a duplicate ingredient", (done) => {

        Category.find({})
            .then( (docs) => {

                let ingredient = new Ingredient({
                    name : 'testname',
                    _creator : docs[0]._id
                })

                ingredient.save()
                    .then((doc) => {

                        request(app)
                            .post('/ingredient')
                            .send({name : 'testname', _creator : docs[0]._id})
                            .expect(400)
                            .expect((res) => {
                                expect(res.body.message).toInclude('duplicate key error')
                            }).end(done)
                    });

            } );
    });

    it("should fail to save/post missing category ID", (done) => {

        request(app)
            .post('/ingredient')
            .send({name : 'New Ingredient test'})
            .expect(400)
            .expect((res) => {
                expect(res.body.message).toInclude('Missing category id')
            }).end(done)
    });


    it("should update a ingredient", (done) => {

        var ingredient = new Ingredient({
            name: 'testname'
        });

        //save first to make sure it will update it
        ingredient.save()
            .then((doc) => {

                //update date
                let nameTestUpdate = 'testnameUpdate';

                request(app)
                    .put('/ingredient')
                    .send({name: nameTestUpdate, _id: doc._id})
                    .expect(204)
                    .end((err, res) => {

                        if(err) {
                            return err;
                        }

                        Ingredient.findOne({_id: doc._id})
                            .then((doc) => {

                                expect(doc.name).toBe(nameTestUpdate);
                                done();

                            }).catch((reason) => {
                                done(reason)
                            });

                    });
            });
    });

    it("should update a ingredient and save recipes attributes", (done) => {

        //save first to make sure it will update

        Ingredient.find({})
            .then((docs) => {

                let ingredient = docs[0];

                Recipe.find({})
                    .then((recs) => {

                        let recipeId = recs[0]._id;

                        let ingredientRecipeCommand = {
                            labelQuantity: 'kg',
                            recipeId: recipeId,
                            ingredientId: ingredient._id
                        }

                        let ingCommand = {
                            name : ingredient.name,
                            _creator: ingredient._creator,
                            expiryDate: ingredient.expiryDate,
                            updateCheckDate: ingredient.updateCheckDate,
                            itemSelectedForShopping: ingredient.itemSelectedForShopping,
                            checkedInCartShopping: ingredient.checkedInCartShopping,
                            ingredientRecipe: ingredientRecipeCommand
                        }

                        request(app)
                            .put('/ingredient')
                            .send(ingCommand)
                            .expect(204)
                            .end((err, res) => {

                                if(err) {
                                    return err;
                                }

                                IngredientRecipe.findOne({recipeId: recipeId, ingredientId:ingredient._id})
                                    .then((doc) => {

                                        expect(doc.labelQuantity).toBe(ingredientRecipeCommand.labelQuantity);
                                        done();

                                    }).catch((reason) => {
                                        done(reason)
                                    });

                            });
                    })
                    .catch(done)
            }).catch(done);
    });

    it("should delete a ingredient", (done) => {

        var name = ingredientTestName + '0';

        Ingredient.findOne({name})
            .then((doc) => {
                request(app)
                    .delete('/ingredient')
                    .send({_id : doc._id})
                    .expect(204)
                    .expect((res) => {

                        Ingredient.find({})
                            .then((docs) => {
                                expect(docs.length).toBe(1);
                            }).catch((reason) => {
                                done(reason)
                            });
                    })
                    .end(done)
            });
    });

    function loadIdsToRecAttributes() {

        let promise = Q.defer();

        let result = {
            recipeId: '',
            ingredientId: ''
        }

        Recipe.find({})
            .then( recs => {
                result.recipeId = recs[0]._id;

                Ingredient.find({})
                    .then(ings => {
                        result.ingredientId = ings[0]._id;

                        promise.resolve(result);

                    }).catch((reason) => {
                       console.error(reason);

                       promise.reject(reason);
                    });

            }).catch((reason) => {
                console.error(reason)
                promise.reject(reason);
            })

        return promise.promise;

    }
});

/**
 * Created by eliasmj on 03/12/2016.
 */

const request = require("supertest");
const expect = require("expect");

const app = require('../../../server').app;

const {Ingredient} = require('../../../models/ingredient.model');
const {Category} = require('../../../models/category.model');
const {Recipe} = require('../../../models/recipe.model');
const {IngredientRecipeAttributes} = require('../../../models/ingredient.recipe.attributes.model');

const categories = [
    {name : "categoryTest_Before"},
    {name : "categoryTest1_before"}
];

const recipeName = 'recipe_test_ingredients';

const Q = require('q');

const ingredientTestName = 'ingredient name test_global';

beforeEach((done) => {

    Category.remove({})
        .then(insertManyCat)

    function insertManyCat() {

        IngredientRecipeAttributes.remove({})
            .then(removedIngredient)
            .then(insertManyCategory)
            .then(saveRecipe)
            .then(saveIngredients)
            .then(saveAttributesRecipes)

        function removedIngredient() {

            return Ingredient.remove({})
        }

        function insertManyCategory() {

            let result = {docs : null, recipeId: null};

            let deferred = Q.defer();

            Category
                .insertMany(categories)
                .then(docs => {

                    result.docs = docs;

                    deferred.resolve(result);

                }).catch((reason) => deferred.reject(reason))

            return deferred.promise;

        }

        function saveIngredients(paramResult) {
            let result = {
                ingredientIds : [],
                recipeId: paramResult.recipeId
            }

            let deferred = Q.defer();

            let count = 0;

            paramResult.docs.forEach(function(item, index){

                let ingredient = new Ingredient({
                    name : ingredientTestName + index,
                    _creator :  item._id
                });

                ingredient.save()
                    .then((ing) => {

                    result.ingredientIds.push(ing._id)

                    if(++count === 2) {
                        deferred.resolve(result);
                    }
                })
            })

           return deferred.promise;
        }

        function saveAttributesRecipes(paramResult) {
            IngredientRecipeAttributes.remove({})
                .then(() => {

                    let ingRecipe = new IngredientRecipeAttributes({
                        labelQuantity: 'kg',
                        name: 'porcaria',
                        ingredientId: paramResult.ingredientIds[0],
                        recipeId: paramResult.recipeId
                    })

                    ingRecipe.save().then(docIngR => { done() });
                })
                .catch(reason => done())
        }

        function saveRecipe(paramResult) {

            let deferred = Q.defer();

            Recipe.remove({name: recipeName})
                .then(docR => {

                    let recipe = new Recipe({
                        name: recipeName
                    });

                    recipe.save().then(docRec => {

                        let result = {
                            recipeId: paramResult.recipeId,
                            docs: paramResult.docs
                        }
                        result.recipeId = docRec._id;

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

                        let ingredientRecipeAttributes = res.body;

                        expect(ingredientRecipeAttributes.ingredientId).toBe(result.ingredientId.toString());
                        expect(ingredientRecipeAttributes.recipeId).toBe(result.recipeId.toString());
                    }).end(done)

            });
    });

    it("should save a ingredient", (done) => {

        Category.find({})
            .then( (docs) => {

                let categoryId = docs[0]._id;

                findRecipe()
                    .then((recipeId) => {

                        let ingredientCommand = {
                            ingredient : {
                                name : 'testname ingredient',
                                _creator : categoryId
                            },
                            ingredientRecipeAttributes : {
                                labelQuantity: 'kg',
                                recipeId: recipeId,
                            }
                        };

                        request(app)
                            .post('/ingredient')
                            .send(ingredientCommand)
                            .expect(201)
                            .end((err, res) => {

                                if (err) return done(err);

                                findIngredient(res, categoryId, recipeId)
                                    .then(findAttributes)
                            });

                    }).catch((reason) => {
                        done(reason);
                    });

                function findRecipe() {
                    let deferred = Q.defer();

                    Recipe.find({})
                        .then(recipes => {

                            let recipeId = recipes[0]._id;

                            deferred.resolve(recipeId);

                        }).catch((reason) => {
                            deferred.reject(reason);
                            done(reason);
                        });

                    return deferred.promise;
                }

                function findIngredient(res, categoryId, recipeId) {

                    let deferred = Q.defer();

                    let id = res.body._id;

                    Ingredient.findOne({_id: id})
                        .then(ingred => {

                            expect(res.body).toIncludeKey('_id');
                            expect(ingred._creator).toEqual(categoryId);

                            let result = {
                                recipeId : recipeId,
                                ingredientId: id
                            }

                            deferred.resolve(result);

                        }).catch((reason) => {
                            deferred.reject(reason);
                            done(reason);
                        });

                    return deferred.promise;
                }

                function findAttributes(result) {

                    IngredientRecipeAttributes.findOne({ingredientId: result.ingredientId, recipeId: result.recipeId})
                        .then(attr => {

                            expect(attr.recipeId.toString()).toBe(result.recipeId.toString());

                            done();

                        }).catch((reason) => {
                            done(reason);
                        });
                }

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
                    name : 'ingre_spec_testname',
                    _creator : docs[0]._id
                })

                ingredient.save()
                    .then((doc) => {

                        request(app)
                            .post('/ingredient')
                            .send({ingredient: {name : 'testname', _creator : docs[0]._id}})
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
            .send({ingredient: {name : 'New Ingredient test'}})
            .expect(400)
            .expect((res) => {
                expect(res.body.message).toInclude('Missing category id')
            }).end(done)
    });


    it("should UPDATE a ingredient", (done) => {

        Category.find({}).then(cats => {

            let cat = cats[0];

            let ingredient = new Ingredient({
                name: 'ingre_spec_testname2',
                _creator : cat._id
            });

            //save first to make sure it will update it
            ingredient.save()
                .then((doc) => {

                    //update date
                    let ingredientCommand = {
                        ingredient : {
                            name : 'ttestnameUpdate',
                            _id : doc._id,
                            _creator: doc._creator
                        }
                    };

                    request(app)
                        .put('/ingredient')
                        .send(ingredientCommand)
                        .expect(204)
                        .end((err, res) => {

                            if (err) return done(err);

                            Ingredient.findOne({_id: doc._id})
                                .then((doc) => {

                                    expect(doc.name).toBe(ingredientCommand.ingredient.name);
                                    done();

                                }).catch((reason) => {
                                done(reason)
                            });

                        });
                });
        })


    });

    it("should update ingredient and save recipes attributes", (done) => {

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
                            ingredient: {
                                name : ingredient.name,
                                _id:ingredient._id,
                                _creator: ingredient._creator,
                                expiryDate: ingredient.expiryDate,
                                updateCheckDate: ingredient.updateCheckDate,
                                itemSelectedForShopping: ingredient.itemSelectedForShopping,
                                checkedInCartShopping: ingredient.checkedInCartShopping,
                            },

                            ingredientRecipeAttributes: ingredientRecipeCommand
                        }

                        request(app)
                            .put('/ingredient')
                            .send(ingCommand)
                            .expect(204)
                            .end((err, res) => {

                                if (err) return done(err);

                                IngredientRecipeAttributes.findOne({recipeId: recipeId, ingredientId:ingredient._id})
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

        IngredientRecipeAttributes.find({})
            .then( recs => {
                result.recipeId = recs[0].recipeId;
                result.ingredientId = recs[0].ingredientId

                promise.resolve(result);

            }).catch((reason) => {
                console.error(reason)
                promise.reject(reason);
            })

        return promise.promise;

    }
});

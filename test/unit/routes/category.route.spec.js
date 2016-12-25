/**
 * Created by eliasmj on 03/12/2016.
 */

const request = require("supertest");
const expect = require("expect");

const app = require('../../../server').app;

const {Category} = require('../../../models/category.model');
const {Ingredient} = require('../../../models/ingredient.model');
const {Recipe} = require('../../../models/recipe.model');
const {IngredientRecipeAttributes} = require('../../../models/ingredient.recipe.attributes.model');


var categories = [
    {name : "categoryTest"},
    {name : "categoryTest2"},
]

let recipeName = 'recipe_test_cat_spec';

const Q = require('q');

var ingredientTestName = 'ingredient_cat name test';

beforeEach(done => {

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

        function saveRecipe(paramResult) {

            let deferred = Q.defer();

            Recipe.remove({name : recipeName})
                .then(() => {

                    let recipe = new Recipe({
                        name: recipeName,
                    });

                    //Save first
                    recipe.save()
                        .then(docRec => {

                            let result = {
                                recipeId: docRec._id,
                                docs: paramResult.docs
                            }

                            Recipe
                                .findOne({_id: docRec._id})
                                .then(recipe => {

                                    //Add category
                                    paramResult.docs.forEach((cat) => {
                                        recipe.categories.push(cat);
                                    });

                                    //save again
                                    recipe.save()
                                        .then(() => {

                                            // Recipe.findOne({_id: docRec._id})
                                            //     .populate('categories')
                                            //     .then( recLast => {
                                            //         console.log("VAI SE FUDEEEEE", recLast)
                                            //     })

                                            deferred.resolve(result);
                                        })

                                }, (reason) => deferred.reject(reason));

                    }).catch(reason => deferred.reject(reason))
                });

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
                        name: 'attribute_test',
                        ingredientId: paramResult.ingredientIds[0],
                        recipeId: paramResult.recipeId
                    })

                    ingRecipe.save().then(docIngR => {
                        done();
                    });
                })
                .catch(reason => done())
        }

    }
});

describe("Category", () => {

    it("should get category list", (done) => {

        request(app)
            .get('/category')
            .expect(200)
            .expect((res) => {
                expect(res.body.length).toBe(2);
            })
            .end(done);

    });

    it("should get category list and ingredient marked", (done) => {

        let catLocalName = 'cat_last_chance';
        let ingredName = 'ingre_xmas';

        //TODO REFACTOR HERE ASAP
        Category.remove({name: catLocalName}).then(() => {

            let category = new Category({
                name: catLocalName
            });

            category.save().then(cated => {

                Ingredient.remove({name: ingredName})
                    .then(() => {

                        let ingredient = new Ingredient({
                            name: ingredName,
                            _creator: cated._id
                        });

                        //I need to save ingredient and add it to category, because it will be retrieved
                        ingredient.save().then(ing => {

                            cated.ingredients.push(ing)

                            cated.save().then(() => {
                                Recipe.findOne({name: recipeName}).then(saved => {

                                    saved.categories.push(cated);

                                    saved.save().then(aleluia => {

                                        Recipe.findOne({_id: saved._id})
                                            .populate('categories')
                                            .then( recLast => {

                                                request(app)
                                                    .get('/category/check/'+recLast._id)
                                                    .expect(200)
                                                    .end((err, res) => {

                                                        if (err) return done(err);


                                                        res.body.forEach(category => {

                                                            if(category.ingredients.length > 0) {

                                                                expect(category.ingredients[0].tempRecipeLinkIndicator).toBe(true)

                                                                console.log("ing to send", category.ingredients);

                                                                done();
                                                            }

                                                        })

                                                        //expect(res.body[0].ingredients.length).toBe(1)

                                                    })

                                            });
                                    });
                                });

                            })

                        });
                })

            });
        });
    });

    it('should load category by passing an Id', (done) => {

        var category = new Category({
            name : 'category name test',
        })

        category.save()
            .then((doc) => {

                request(app)
                    .get('/category/' + doc._id)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body._id).toBe(doc._id.toString())
                    }).end(done)
            });
    });

    it("should save/post a category", (done) => {

        let name = 'testname category';
        let id;

        request(app)
            .post('/category')
            .send({'name' : name})
            .expect(201)
            .expect((res) => {
                expect(res.body).toIncludeKey('_id');
                id = res.body._id;

                Category.findOne({_id: id})
                    .then((docs) => {
                        expect(docs.length).toBe(3)

                    }).catch((reason) => {
                    return reason
                });
            })
            .end(done);

    });

    it("should fail to save/post a category", (done) => {

        request(app)
            .post('/category')
            .expect(400)
            .expect((res) => {
                expect(res.body).toIncludeKeys(['message', 'errors', 'name']);

                Category.find({})
                    .then((docs) => {

                        expect(docs.length).toBe(2);

                    }).catch((reason) => {
                    return reason
                });
            })
            .end(done);

    });

    it("should fail to save/post a duplicate category", (done) => {

        var category = new Category({
            name : 'cat_testname',
        })

        category.save()
            .then(() => {
                request(app)
                    .post('/category')
                    .send({name : 'cat_testname'})
                    .expect(400)
                    .expect((res) => {
                        expect(res.body.message).toInclude('duplicate key error')
                    }).end(done)
            });
    });

    it("should update a category", (done) => {

        var category = new Category({
            name: 'cat_ testname2'
        });

        //save first to make sure it will update it
        category.save()
            .then((doc) => {

                //update date
                let nameTestUpdate = 'catenameUpdate';

                request(app)
                    .put('/category')
                    .send({name: nameTestUpdate, _id: doc._id})
                    .expect(204)
                    .end((err, res) => {

                        if (err) return done(err);

                        Category.findOne({_id: doc._id})
                            .then((doc) => {

                                expect(doc.name).toBe(nameTestUpdate);
                                done();

                            }).catch((reason) => {
                                done(reason)
                            });

                    });
            });
    });

    it("should delete a category", (done) => {

        Category.find({})
            .then((docs) => {

                request(app)
                    .delete('/category')
                    .send({_id : docs[0]._id})
                    .expect(204)
                    .end((err, res) => {

                        if(err) {
                            console.log("ERROR", err)
                            return
                        }

                        Category.find({})
                            .then((docs) => {
                                expect(docs.length).toBe(1);
                                done();
                            }).catch((reason) => {
                                done(reason)
                            });

                    })

            });

    });

    it("should get category along ingredient populated", (done) => {

            //IF I try do this in the beforeEach does not work!
            Category.find({})
                .then((cats) => {

                    cats.forEach((category, index) => {

                        var ingredient = new Ingredient({
                            name : ingredientTestName + index ,
                            _creator :  category._id
                        });

                        ingredient.save().then((ing) => {

                            category.ingredients.push(ing)
                            category.save();

                            request(app)
                                .get('/category')
                                .expect(200)
                                .end((err, res) => {

                                    if(err) throw err

                                    let categories  = res.body;

                                    expect(categories.length).toBe(2);

                                    categories.forEach( (cat) => {
                                        expect(cat.ingredients.length).toBe(1)
                                    });

                                    if(++index === 2) {
                                        done()
                                    }
                                });
                        })
                    })

                });
    });
});

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

const categoryNames = [
    "from_cat_categoryTest0",
    "from_cat_categoryTest1",
    "from_cat_categoryTest2",
    "from_cat_categoryTest3",
    "from_cat_categoryTest4",
    "from_cat_categoryTest5",
    "from_cat_categoryTest6",
    "from_cat_categoryTest7",
    "from_cat_categoryTest8",
    "from_cat_categoryTest9"
];

const ingredientNames = [
    "from_cat_ingredient0",
    "from_cat_ingredient1",
    "from_cat_ingredient2",
    "from_cat_ingredient3",
    "from_cat_ingredient4",
    "from_cat_ingredient5",
    "from_cat_ingredient6",
    "from_cat_ingredient7",
    "from_cat_ingredient8",
    "from_cat_ingredient9"
];

const categories = [
    {name : categoryNames[0]},
    {name : categoryNames[1]},
];

let recipeName = 'recipe_test_cat_spec';

const Q = require('q');

beforeEach(done => {

    let count_names = categoryNames.length;

    categoryNames.forEach(name => {

        Category.remove({name})
            .then(() => {

                if(--count_names === 0) {
                    insertManyCat();
                }
            });
    });

    function insertManyCat() {

        //FIXME remove all will mess
        IngredientRecipeAttributes.remove({})
            .then(removedIngredient)
            .then(insertManyCategory)
            .then(saveRecipe)
            .then(saveIngredients)
            .then(saveAttributesRecipes);

        function removedIngredient() {

            let count = ingredientNames.length;
            ingredientNames.forEach(name => {
                Ingredient.remove({name})
                    .then(() => {

                        if(--count === 0) {
                            let deferred = Q.defer();
                            deferred.resolve({});
                            return deferred.promise;
                        }

                    });
            });
        }

        function insertManyCategory() {

            let result = {categories : null, recipeId: null};

            let deferred = Q.defer();

            Category
                .insertMany(categories)
                .then(docs => {

                    result.categories = docs;

                    deferred.resolve(result);

                }).catch((reason) => deferred.reject(reason));

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
                                categories: paramResult.categories
                            };

                            Recipe
                                .findOne({_id: docRec._id})
                                .then(recipe => {

                                    //Add category
                                    paramResult.categories.forEach((cat) => {
                                        recipe.categories.push(cat);
                                    });

                                    //save again
                                    recipe.save()
                                        .then(() => {
                                            deferred.resolve(result);
                                        });

                                }, (reason) => deferred.reject(reason));

                    }).catch(reason => deferred.reject(reason))
                });

            return deferred.promise;
        }

        function saveIngredients(paramResult) {
            let result = {
                ingredientIds : [],
                recipeId: paramResult.recipeId
            };

            let deferred = Q.defer();

            let count = paramResult.categories.length;

            paramResult.categories.forEach(function(category, index){

                //FIXME messy name
                let ingredient = new Ingredient({
                    name : ingredientNames[index],
                    _creator :  category._id
                });

                ingredient.save()
                    .then(ing => {

                        result.ingredientIds.push(ing._id);

                        Category.findOne({_id: category._id})
                            .then(category => {

                                category.ingredients.push(ing);

                                category.save().then(() => {

                                    if(--count === 0) {

                                        deferred.resolve(result);
                                    }

                                });

                            });
                    });
            });

            return deferred.promise;
        }

        function saveAttributesRecipes(paramResult) {

            IngredientRecipeAttributes.remove({})
                .then(() => {

                    let ingRecipe = new IngredientRecipeAttributes({
                        labelQuantity: 'kg',
                        name: 'attribute_test',
                        ingredientId: paramResult.ingredientIds[0],
                        recipeId: paramResult.recipeId,
                        itemSelectedForShopping: true
                    });

                    ingRecipe.save()
                        .then(() => {

                            Ingredient.findOne({_id: paramResult.ingredientIds[0]})
                                .then(ingredient => {

                                    ingredient.attributes.push(ingRecipe);

                                    ingredient.save().then(() => {
                                        done();
                                    })
                                });
                        });
                })
                .catch(reason => done());
        }

    }
});

describe("Category", () => {

    it("should get category list", (done) => {

        request(app)
            .get('/category')
            .expect(200)
            .expect((res) => {

                expect(res.body.length >= 2).toBe(true);
            })
            .end(done);

    });

    it("should get category list and ingredient marked", (done) => {

        Recipe.findOne({name: recipeName}).then(recipe => {

            request(app)
                .get('/category/check/'+recipe._id)
                .expect(200)
                .end((err, res) => {

                    if (err) return done(err);

                    let categories = res.body;

                    categories.forEach(category => {
                        if(category.ingredients.length > 0) {
                            expect(category.ingredients[0].tempRecipeLinkIndicator).toBe(true);

                        }
                    });

                    done();

                    if (err) return done("didn't find recipe");
                });
        })



        // let ingredName = ingredientNames[3];
        //
        // let category = new Category({
        //     name: categoryNames[3]
        // });
        //
        // category.save().then(cated => {
        //
        //     let ingredient = new Ingredient({
        //         name: ingredName,
        //         _creator: cated._id
        //     });
        //
        //     //I need to save ingredient and add it to category, because it will be retrieved
        //     ingredient.save().then(ing => {
        //
        //         cated.ingredients.push(ing);
        //
        //         cated.save().then(() => {
        //             Recipe.findOne({name: recipeName}).then(recipe => {
        //
        //                 recipe.categories.push(cated);
        //
        //                 recipe.save().then(aleluia => {
        //
        //                     request(app)
        //                         .get('/category/check/'+aleluia._id)
        //                         .expect(200)
        //                         .end((err, res) => {
        //
        //                             if (err) return done(err);
        //
        //                             let categories = res.body;
        //
        //                             categories.forEach(category => {
        //                                 if(category.ingredients.length > 0) {
        //                                     expect(category.ingredients[0].tempRecipeLinkIndicator).toBe(true);
        //                                     done();
        //                                 }
        //                             });
        //
        //                             if (err) return done("didn't find recipe");
        //                         });
        //                 });
        //             });
        //
        //         })
        //
        //     });
        // });
    });

    it('should load category by passing an Id', (done) => {

        const category = new Category({
            name : categoryNames[4],
        });

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

        let name = categoryNames[8];
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

        const category = new Category({
            name : categoryNames[5],
        });

        category.save()
            .then(() => {
                request(app)
                    .post('/category')
                    .send({name : categoryNames[5]})
                    .expect(400)
                    .expect((res) => {
                        expect(res.body.message).toInclude('duplicate key error')
                    }).end(done)
            });
    });

    it("should update a category", (done) => {

        var category = new Category({
            name: categoryNames[6]
        });

        //save first to make sure it will update it
        category.save()
            .then((doc) => {

                //update date
                let nameTestUpdate = categoryNames[7];

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

                let category = docs[0];

                request(app)
                    .delete('/category')
                    .send({_id : category._id})
                    .expect(204)
                    .end((err, res) => {

                        if(err) {
                            return done(err)
                        }

                        Category.findOne({_id : category._id})
                            .then((doc) => {
                                expect(doc).toBe(null);
                                done();
                            }).catch((reason) => {
                                done(reason)
                            });

                    })

            });

    });

    it("should get category along ingredient populated", (done) => {

        //FIXME review test
        request(app)
            .get('/category')
            .expect(200)
            .end((err, res) => {

                if(err) throw err

                let categories  = res.body;

                let temp = 0;
                categories.forEach( (cat) => {

                    if(cat.ingredients.length > 0) {
                        temp++;
                    }

                });
                //for now the category its messy
                expect(temp > 0).toBe(true);

                done();
            });
    });

    it("should get category/ingredient for the shopping week", done => {

        request(app)
            .get('/category/week/shopping')
            .expect(200)
            .end((err, res) => {

                if(err) throw err

                let categories  = res.body;

                let contLoopEnd = categories.length;

                let hasIngredient = false;

                categories.forEach( (cat) => {

                    console.log("*****",contLoopEnd)

                    cat.ingredients.forEach(ingredient => {

                        console.log(">>>><<<<<<<<<",ingredient.attributes)

                       // expect(ingredient.itemSelectedForShopping).toBe(true);
                        hasIngredient = true;
                    });


                    if(--contLoopEnd === 0) {
                        expect(hasIngredient).toBe(true);
                        done();
                    }

                });

            });
    });
});

/**
 * Created by eliasmj on 21/11/2016.
 *
 * npm run test-watch
 */

const request = require('supertest');
const expect = require('expect');

const app = require('../../../server').app;

const {Recipe} = require('../../../models/recipe.model');
const {Category} = require('../../../models/category.model');
const {Ingredient} = require('../../../models/ingredient.model');
const {IngredientRecipeAttributes} = require('../../../models/ingredient.recipe.attributes.model');

const categoryNames = [
    'from_rec_cattest0',
    'from_rec_cattest1'
];

const ingredientNames = [
    "from_rec_ingredient0",
    "from_rec_ingredient1"
];

const Q = require('q');

const recipes = [
    {
        name: 'from_rec_spec_testname1',
        isInMenuWeek: true
    },
    {
        name: 'from_rec_spec_testname2'
    }];


describe('Recipe', () => {

    beforeEach((done) => {

        function removeAll() {

            IngredientRecipeAttributes.remove({}).then(() => {
                Ingredient.remove({}).then(() => {
                    Category.remove({}).then(() => {
                        Recipe.remove({}).then(() => {
                            kickOff();
                        });
                    });
                })

            });
        }

        function kickOff() {

            Recipe.insertMany(recipes)
                .then(saveCategory)
                .then(saveIngredient)
                .then(saveIngredientAttributeAndAddToArray)
                .then(findRecipeAndLinkToCategory);

            function saveCategory(recs) {

                const Q = require('q');

                let defer = Q.defer();

                let chainResult = {
                    recipes : recs,
                    category: null
                };

                //insert category
                let category = new Category({
                    name: categoryNames[0]
                });

                category.save()
                    .then(category => {
                        chainResult.category = category;

                        defer.resolve(chainResult);
                    })
                    .catch(reason => defer.reject(reason));


                return defer.promise;
            }

            function saveIngredient(chainResult) {

                let defer = Q.defer();

                let ingredient = new Ingredient({
                    name: ingredientNames[0],
                    _creator: chainResult.category._id
                });

                ingredient.save()
                    .then(ingredient => {

                        chainResult.ingredient = ingredient;

                        defer.resolve(chainResult);

                    }).catch(reason => defer.reject(reason));

                return defer.promise;
            }

            function saveIngredientAttributeAndAddToArray(chainResult) {

                let defer = Q.defer();

                let ingredient = chainResult.ingredient;
                let category = chainResult.category;

                let attribute = new IngredientRecipeAttributes({
                    name: chainResult.recipes[0].name,
                    ingredientId: ingredient._id,
                    recipeId: chainResult.recipes[0]._id,
                    itemSelectedForShopping: true
                });

                attribute.save().then(() => {

                    ingredient.attributes.push(attribute);

                    ingredient.save()
                        .then(() => {

                            category.ingredients.push(ingredient);

                            category.save().then(() => {

                                defer.resolve(chainResult);

                            }).catch(reason => defer.reject(reason));

                        }).catch(reason => defer.reject(reason));

                });

                return defer.promise;
            }

            function findRecipeAndLinkToCategory(chainResult) {

                let name = chainResult.recipes[0].name;

                Recipe.findOne({name})
                    .then(docFindOne => {

                        docFindOne.categories.push(chainResult.category);

                        docFindOne.save()
                            .then(() => {
                                done();
                            }).catch((reason) => {
                                done(reason);
                            });

                    });

            }
        }

        removeAll();
    });

    it('should get recipe list', (done) => {

       request(app)
           .get('/recipe')
           .expect(200)
           .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true)
           })
           .end(done)

    });

    it('should get recipe Week List', (done) => {

        request(app)
            .get('/recipe/week')
            .expect(200)
            .expect((res) => {
                expect(res.body.length).toBe(1);
            })
            .end(done)

    });

    it('should load recipe by passing an Id', (done) => {

        Recipe.findOne({name : recipes[0].name}).then(rec => {

                request(app)
                    .get('/recipe/' + rec._id)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body._id).toBe(rec._id.toString())
                    }).end(done);
        });


    });

    it("should save/post a recipe", (done) => {

        let name = 'rec_spec_post';
        let id;

        Recipe.remove({name}).then( () => {
            request(app)
                .post('/recipe')
                .send({'name' : name})
                .expect(201)
                .expect((res) => {
                    expect(res.body).toIncludeKey('_id');
                    id = res.body._id;

                    Recipe.findOne({_id: id})
                        .then((docs) => {
                            expect(docs.length).toBe(3)

                        }).catch((reason) => {
                        return reason
                    });
                })
                .end(done);
        });
    });

    it("should fail to save/post a recipe, empty name", (done) => {

        request(app)
            .post('/recipe')
            .expect(400)
            .end((err, res) => {

                if (err) return done(err);

                Recipe.find({})
                    .then((docs) => {

                        expect(res.body).toIncludeKeys(['message', 'errors', 'name']);
                        done();

                    }).catch((reason) => {
                        done(reason);
                    });
            });

    });

    it("should fail to save/post a duplicate recipe", (done) => {

        request(app)
            .post('/recipe')
            .send({name : recipes[0].name})
            .expect(400)
            .expect((res) => {
                expect(res.body.message).toInclude('duplicate key error')
            }).end(done)
    });

    it("should update a recipe", (done) => {

        let nameTestUpdate = 'from_recipe_testnameUpdate';

        Recipe.findOne({name: recipes[1].name})
            .then(rec => {

                request(app)
                    .put('/recipe')
                    .send({name: nameTestUpdate, _id: rec._id})
                    .expect(204)
                    .end((err, res) => {

                        if (err) return done(err);

                        Recipe.findOne({name: recipes[1].name})
                            .then(doc => {

                                expect(doc).toBe(null);
                                done();

                            }).catch((reason) => {
                                done(reason)
                            });
                    });
            });

    });


    it("should get all recipe's ingredients along it categories", (done) => {

        let name = recipes[0].name;

        Recipe.findOne({name})
            .then((docFindOne) => {

                request(app)
                    .get('/recipe/category/'+ docFindOne._id)
                    .expect(200)
                    .end((err, res) => {

                        if (err) return done(err);

                        let recipe = res.body;

                        expect(recipe.categories.length).toBe(1);

                        recipe.categories.forEach(category => {

                            expect(category.ingredients.length > 0).toBe(true);

                        });

                        done();
                    });
            });
    });

    it("should link recipe to categories/ingredients and return it populated", (done) => {

        let name = recipes[0].name;

        Recipe.findOne({name}).then(recipe => {

            //same recipe name
            IngredientRecipeAttributes.findOne({name}).then(attr => {

                attr.isRecipeLinkedToCategory = true;

                attr.save().then(() => {

                    Ingredient.findOne({_id: attr.ingredientId}).then(ingredient => {
                        //mark checkbox
                        ingredient.tempRecipeLinkIndicator = true;
                        sendRecipeAndParameters(ingredient);
                    });
                });
            });
        });


        function sendRecipeAndParameters(ingredient) {

            let name = recipes[0].name;

            Recipe.findOne({name}).then( (recFindOne) => {

                request(app)
                    .put('/recipe/ingredient')
                    .send({_id: recFindOne._id, ingredient : ingredient})
                    .expect(204)
                    .end((err, res) => {

                        if (err) return done(err);

                        requestRecipePopulated(recFindOne._id, ingredient);
                    });
            });
        }

        function requestRecipePopulated(id, ingredientSent) {
            let getInto = false;
            request(app)
                .get('/recipe/category/'+ id)
                .expect(200)
                .end((err, res) => {

                    if (err) return done(err);

                    let recipe = res.body;

                    recipe.categories.forEach(cat => {
                        //send the tempRecipeLinkIndicator/false = remove
                        cat.ingredients.forEach(ing => {

                            if(ing.name === ingredientSent.name) {
                                expect(ingredientSent.tempRecipeLinkIndicator).toBe(true);
                                getInto = true;
                            }

                        });
                    });

                    //make sure the expect run in the loop
                    expect(getInto).toBe(true);

                    done();
                });
        }

    });

    it("should load all ingredients and current attributes of a recipe", done => {

        Recipe.findOne({name: recipes[0].name}).then(rec => {

            request(app)
                .get('/recipe/category/currentAttribute/'+rec._id)
                .expect(200)
                .expect(res => {
                    let recipe = res.body;

                   // console.log("deep docSaved", categories);

                    recipe.categories.forEach(category => {

                        category.ingredients.forEach(ingredient => {

                            expect(ingredient.attributes.length > 0).toBe(true);
                            expect(ingredient.attributes[0].itemSelectedForShopping).toBe(true);

                        });

                    });

                })
                .end(done)
        });
    });

    it("should delete a recipe", (done) => {

        let name = recipes[0].name;

        Recipe.findOne({name})
            .then((doc) => {
                request(app)
                    .delete('/recipe')
                    .send({_id : doc._id})
                    .expect(204)
                    .expect((res) => {
                        Recipe.findOne({name})
                            .then(result => {
                                expect(result).toBe(null);
                            });
                    })
                    .end(done)
            });
    });

    function createCategory(name) {

        const deferred = Q.defer();

        let category = new Category({name});

        category.save()
            .then(cat => {
                deferred.resolve(cat);
            }).catch(reason => deferred.reject(reason));

        return deferred.promise;
    }

    function createIngredient(name, cat) {

        const deferred = Q.defer();

        let ingredient = new Ingredient({
            name,
            _creator: cat._id
        });

        ingredient.save()
            .then(() => {

                deferred.resolve({ingredient, cat});

            }).catch(reason => deferred.reject(reason));

        return deferred.promise;
    }

    function linkIngredientToCategory(result) {
        const deferred = Q.defer();

        let cat = result.cat;

        //Link Ingredient to category
        cat.ingredients.push(result.ingredient);

        cat.save()
            .then(() => {
                deferred.resolve(cat);
            }).catch(reason => deferred.reject(reason));

        return deferred.promise;
    }

});

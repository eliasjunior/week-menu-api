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

const recipes = [
    {
        name: 'testname1'
    },
    {
        name: 'testname2'
    }];

beforeEach((done) => {
    Recipe.remove({})
        .then(() => {
            Recipe.insertMany(recipes).then(() => {

                done()

            });
        });
});

describe('Recipe', () => {

    it('should get recipe list', (done) => {

       request(app)
           .get('/recipe')
           .expect(200)
           .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true)
           })
           .end(done)

    });

    it('should load recipe by passing an Id', (done) => {

        var recipe = new Recipe({
            name : 'testname',
        })

        recipe.save()
            .then((doc) => {

                request(app)
                    .get('/recipe/' + doc._id)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body._id).toBe(doc._id.toString())
                    }).end(done)
            });
    });

    it("should save/post a recipe", (done) => {

        let name = 'testname';
        let id;

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

    it("should fail to save/post a recipe", (done) => {

        request(app)
            .post('/recipe')
            .expect(400)
            .expect((res) => {
                expect(res.body).toIncludeKeys(['message', 'errors', 'name']);

                Recipe.find({})
                    .then((docs) => {

                        expect(docs.length).toBe(2)

                    }).catch((reason) => {
                        return reason
                    });
            })
            .end(done);

    });

    it("should fail to save/post a duplicate recipe", (done) => {

        var recipe = new Recipe({
            name : 'testname',
        })

        recipe.save()
            .then((doc) => {
                request(app)
                    .post('/recipe')
                    .send({name : 'testname'})
                    .expect(400)
                    .expect((res) => {
                        expect(res.body.message).toInclude('duplicate key error')
                    }).end(done)
            });
    });

    it("should update a recipe", (done) => {

        var recipe = new Recipe({
            name: 'testname'
        });

        //save first to make sure it will update it
        recipe.save()
            .then((doc) => {

                //update date
                let nameTestUpdate = 'testnameUpdate';

                request(app)
                    .put('/recipe')
                    .send({name: nameTestUpdate, _id: doc._id})
                    .expect(204)
                    .end((err, res) => {

                        if(err) {
                            return err;
                        }

                        Recipe.findOne({_id: doc._id})
                            .then((doc) => {

                                expect(doc.name).toBe(nameTestUpdate);
                                done()

                            }).catch((reason) => {
                                done(reason)
                            });

                    });
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

                        Recipe.find({})
                            .then((docs) => {
                                expect(docs.length).toBe(1);
                            }).catch((reason) => {
                                done(reason)
                            });
                    })
                    .end(done)

            });

    });

    it("should get all recipe's ingredients along it categories", (done) => {


        let category = new Category({
            name: 'cat_recipe_test'
        });

        category.save()
            .then((doc) => {

                let ingredient = new Ingredient({
                    name: 'ingredient_test_rec',
                    _creator: doc._id
                });

                ingredient.save()
                    .then(() => {

                        findRecipeAndRequestApi();

                    }).catch((reason) => {
                        console.error(" error saving ingredient", reason)
                    });
            });

        function findRecipeAndRequestApi() {
            let name = recipes[0].name;

            Recipe.findOne({name})
                .then((docFindOne) => {

                    docFindOne.categories.push(category)
                    docFindOne.save()
                        .then(() => {

                            request(app)
                                .get('/recipe/category/'+ docFindOne._id)
                                .expect(200)
                                .end((err, res) => {

                                    if(err) {
                                        throw err;
                                    }

                                    let recipe = res.body;

                                    expect(recipe.categories.length).toBe(1)

                                    done()

                                });
                        }).catch((reason) => {
                            console.error("error saving recipe", reason)
                        });

                });
        }
    });


    it("should link recipe to categories/ingredients and return it populated", (done) => {

        function createCategoryToSend() {

            let categories = [];

            let category = new Category({
                name: 'testCatRec'
            });

            category.save()
                .then(() => {

                    let ingredient = new Ingredient({
                        name: 'testIngrRec'
                    });

                    ingredient.save()
                        .then(() => {

                            category.ingredients.push(ingredient);
                            category.save()
                                .then(() => {
                                    categories.push(category);

                                    sendRecipeAndParameters(categories);
                                });

                        });

                });
        }

        function sendRecipeAndParameters(categories) {

            let name = recipes[0].name;

            Recipe.findOne({name})
                .then( (recFindOne) => {

                    request(app)
                        .put('/recipe/category')
                        .send({_id: recFindOne._id, categories : categories})
                        .expect(204)
                        .end((err, res) => {

                            if(err) {
                                throw err;
                            }
                            requestRecipePopulated(recFindOne._id)
                        });
                });

        }

        function requestRecipePopulated(id) {
            request(app)
                .get('/recipe/category/'+ id)
                .expect(200)
                .end((err, res) => {

                    if(err) {
                        throw err;
                    }

                    let recipe = res.body;

                    expect(recipe.categories.length).toBe(1)
                    expect(recipe.categories[0].ingredients.length).toBe(1);

                    done()
                });
        }

        createCategoryToSend();
    });
});

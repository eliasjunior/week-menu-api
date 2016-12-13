/**
 * Created by eliasmj on 03/12/2016.
 */

const request = require("supertest");
const expect = require("expect");

const app = require('../../../server').app;

const {Category} = require('../../../models/category.model');
const {Ingredient} = require('../../../models/ingredient.model');

var categories = [
    {name : "categoryTest_"},
    {name : "categoryTest2_"},
]

var ingredientTestName = 'ingredient_cat name test';

beforeEach((done) => {

    Category.remove({}).then(insertMany)

    function insertMany() {

        Ingredient.remove({}).then(() => {

            Category
                .insertMany(categories)
                .then((docs) => {
                    done()
                });
        });
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
            name : 'testname',
        })

        category.save()
            .then((doc) => {
                request(app)
                    .post('/category')
                    .send({name : 'testname'})
                    .expect(400)
                    .expect((res) => {
                        expect(res.body.message).toInclude('duplicate key error')
                    }).end(done)
            });
    });

    it("should update a category", (done) => {

        var category = new Category({
            name: 'testname'
        });

        //save first to make sure it will update it
        category.save()
            .then((doc) => {

                //update date
                let nameTestUpdate = 'testnameUpdate';

                request(app)
                    .put('/category')
                    .send({name: nameTestUpdate, _id: doc._id})
                    .expect(204)
                    .end((err, res) => {

                        if(err) {
                            return err;
                        }

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

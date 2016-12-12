/**
 * Created by eliasmj on 03/12/2016.
 */

const request = require("supertest");
const expect = require("expect");

const app = require('../../../server').app;

const {Ingredient} = require('../../../models/ingredient.model');
const {Category} = require('../../../models/category.model');

var categories = [
    {name : "categoryTest"},
    {name : "categoryTest1"}
]

var ingredientTestName = 'ingredient name test';

beforeEach((done) => {

    Category.remove({}).then(insertMany)

    function insertMany() {

        Ingredient.remove({}).then((doc) => {
            Category
                .insertMany(categories)
                .then((docs) => {

                    docs.forEach(function(item, index){

                        var ingredient = new Ingredient({
                            name : ingredientTestName + index,
                            _creator :  item._id
                        })

                        ingredient.save().then((doc) => {})

                    })
                    done()
                });
        });

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

    it("should save/post a ingredient", (done) => {

        Category.find({})
            .then( (docs) => {

                let categoryId = docs[0]._id

                let ingredient = {name : 'testname ingredient', _creator : categoryId};

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
                    });

            } );


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



});

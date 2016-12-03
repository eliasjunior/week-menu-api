/**
 * Created by eliasmj on 03/12/2016.
 */

const request = require("supertest");
const expect = require("expect");

const app = require('../../../server').app;

const {Ingredient} = require('../../../models/ingredient.model');

var ingredients = [
    {name : "ingredientTest"},
    {name : "ingredientTest1"},
]

beforeEach((done) => {

    Ingredient.remove({}).then(insertMany)

    function insertMany() {
        Ingredient
            .insertMany(ingredients)
            .then(() => {
                done();
            })
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

        let name = 'testname ingredient';
        let id;

        request(app)
            .post('/ingredient')
            .send({'name' : name})
            .expect(201)
            .expect((res) => {
                expect(res.body).toIncludeKey('_id');
                id = res.body._id;

                Ingredient.findOne({_id: id})
                    .then((docs) => {
                        expect(docs.length).toBe(3)

                    }).catch((reason) => {
                    return reason
                });
            })
            .end(done);

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

        var ingredient = new Ingredient({
            name : 'testname',
        })

        ingredient.save()
            .then((doc) => {
                request(app)
                    .post('/ingredient')
                    .send({name : 'testname'})
                    .expect(400)
                    .expect((res) => {
                        expect(res.body.message).toInclude('duplicate key error')
                    }).end(done)
            });
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

        let name = ingredients[0].name;

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

    })


});

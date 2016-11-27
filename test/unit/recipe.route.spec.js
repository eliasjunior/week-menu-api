/**
 * Created by eliasmj on 21/11/2016.
 */


/**

    test recipe route

    test get recipe, it should return a recipe
    test post recipe, it should creacre a recipe
    test put recipe, it should update recipe
    test delete recipe, it should delete recipe

    get recipe associations, get ingredient list by recipe


    test ingredient
    get, post, put , delete

    test category
    ...


 */

const request = require('supertest');
const expect = require('expect');

var app = require('../../server').app;

describe('Recipe', () => {

    it('should get recipe list and return an list', (done) => {

       request(app)
           .get('/recipe')
           .expect(200)
           .expect((res) => {
                expect(res.body).toEqual([])
           })
           .end(done)

    });

    it('should load recipe by passing an Id', (done) => {

        request(app)
            .get('/recipe/1')
            .expect(200)
            .expect((res) => {
                expect(res.body).toEqual({})
            })
            .end(done)

    });

    it("should save/post a recipe", (done) => {

        request(app)
            .post('/recipe')
            .expect(201)
            .end(done)


    });

    it("should update a recipe", (done) => {

        request(app)
            .put('/recipe')
            .expect(204)
            .end(done);

    });

    it("should delete a recipe", (done) => {
        request(app)
            .delete('/recipe')
            .expect(200)
            .end(done);
    })

});

const router = require('express').Router();
const responseHandlerService = require('../services/response.handler.service');
const RecipeService = require('../services/recipe.service');
const {STATUS} = require('../constants/status.code');

function get(request, response) {
    RecipeService
        .get()
        .then(doc => responseHandlerService.send(response, {doc, status: STATUS.GET_CODE}))
        .catch(reason => responseHandlerService.error(response, reason));
}
function save(request, response) {
    RecipeService
        .save(request.body)
        .then(doc => responseHandlerService.send(response, {doc, status: STATUS.CREATE_CODE}))
        .catch(reason => responseHandlerService.error(response, reason));
}

router.get("/recipe", get);
router.post("/recipe", save);


module.exports = router;
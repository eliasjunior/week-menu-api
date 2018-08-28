const router = require('express').Router();
const responseHandlerService = require('../services/response.handler.service');
const CategoryService = require('../services/category.service');
const {STATUS} = require('../constants/status.code');

function getCategoryRoute(request, response) {
    CategoryService
        .get()
        .then(doc => responseHandlerService.send(response, {doc, status: STATUS.GET_CODE}))
        .catch(reason => responseHandlerService.error(response, reason));
}

router.get("/category", getCategoryRoute);

module.exports = router;
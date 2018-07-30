const log = require('../utils/log.message');
const ProductService = require('../services/product.service');
const router = require('express').Router();
const responseHandlerService = require('../services/response.handler.service');
const {STATUS} = require('../constants/status.code');

router.put("/product", (request, response) => {
    ProductService.update(request.body.ingredient)
        .then(doc =>  {
            responseHandlerService.send(response, [], STATUS.UPDATE_CODE)
        }).catch(reason => responseHandlerService.error(response, reason));
});

module.exports = router;
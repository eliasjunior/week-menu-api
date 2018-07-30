const ProductService = () => {
    const log = require('../utils/log.message');
    return {
        update: (productRequest) => {
            const {Ingredient} = require('../models/ingredient.model');
            log.logExceptOnTest("update > ", productRequest.name);
            log.logExceptOnTest("** id ", productRequest._id);
            try {
                const res = Ingredient.findByIdAndUpdate(productRequest._id, 
                    {
                        $set: {
                            name: productRequest.name
                        }
                    }
                );
                return res
            } catch (error) {
                log.logExceptOnTest(error)
                log.logExceptOnTest("ERROR tryging to update product ");
            }
        }
    }
}

module.exports = ProductService();
import Joi from 'joi'

// LOGIN
const login = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().max(20).required(), 
})

// CREATE
const createDistributor = Joi.object({
    name : Joi.string().max(50).required(),
    phone : Joi.string().max(50).optional().allow(null),
    email : Joi.string().max(100).optional().allow(null),
    ecommerceLink : Joi.string().optional().allow(null),
    imagePath : Joi.string().optional().allow(null),
    address : Joi.string().optional().allow(null)
})

const createProduct = Joi.object({
    name : Joi.string().max(30).required(),
    imagePath : Joi.string().optional().allow(null),
    stock : Joi.number().integer(),
    subtotal : Joi.number().precision(2),
    createdBy : Joi.number().integer(),
    distributorId : Joi.number().integer().optional().allow(null),
    typeId : Joi.number().integer(),
    profitPercent : Joi.number().precision(2)
})

// UPDATE
const updateDistributor = Joi.object({
    name : Joi.string().optional().allow(null),
    phone : Joi.string().max(50).optional().allow(null),
    email : Joi.string().max(100).optional().allow(null),
    ecommerceLink : Joi.string().optional().allow(null),
    imagePath : Joi.string().optional().allow(null),
    address : Joi.string().optional().allow(null)
})

const updateProduct = Joi.object({
    name : Joi.string().max(30).optional().allow(null),
    imagePath : Joi.string().optional().allow(null),
    distributorId : Joi.number().integer().optional().allow(null),
    typeId : Joi.number().integer().optional().allow(null)
})

export{
    login, createProduct, createDistributor, updateDistributor, updateDistributor
}

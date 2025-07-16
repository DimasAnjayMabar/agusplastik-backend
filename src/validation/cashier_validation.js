import Joi from 'joi'

// LOGIN
const login = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().max(20).required(), 
})

// CREATE
const createTransaction = Joi.object({
    barcode : Joi.string().max(50).required(),
    name : Joi.string().max(30).required(),
    quantity : Joi.number().integer().required(),
    createdAt : Joi.date().timestamp().optional().allow(null),
    customerId : Joi.number().integer().required(), 
    discountId : Joi.number().integer().optional().allow(null)
})

const createCustomer = Joi.object({
    name : Joi.string().max(30).required(),
    address : Joi.string().max(100).optional().allow(null),
    phone : Joi.string().max(20).optional().allow(null),
    nik : Joi.string().max(30).optional().allow(null),
    imagePath : Joi.string().optional().allow(null),
})

// UPDATE 
const updateCustomer = Joi.object({
    name : Joi.string().max(30).optional().allow(null),
    address : Joi.string().max(100).optional().allow(null),
    phone : Joi.string().max(20).optional().allow(null)
})

const updateTransaction = Joi.object({
    createdAt : Joi.date().timestamp().optional().allow(null),
    status : Joi.string().max().optional().allow(null),
    payment : Joi.string().max(10).optional().allow(null)
})


import Joi from 'joi'

// LOGIN
const login = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().max(20).required(), 
})

// CREATE
const createDistributorValidation = Joi.object({
    name : Joi.string().max(50).required(),
    phone : Joi.string().max(50).optional().allow(null),
    email : Joi.string().max(100).optional().allow(null),
    ecommerceLink : Joi.string().optional().allow(null),
    imagePath : Joi.string().optional().allow(null),
    address : Joi.string().optional().allow(null)
})

const productItemSchema = Joi.object({
  name: Joi.string().max(30).required(),
  imagePath: Joi.string().allow(null, ''),
  stock: Joi.number().integer().min(1).required(),
  subtotal: Joi.number().precision(2).min(1).required(),
  typeId: Joi.number().integer().required(),
  profitPercent: Joi.number().precision(2).min(0).required()
});

const createStockInSchema = Joi.object({
  distributorId: Joi.number().integer().allow(null),
  invoiceDate: Joi.date().optional(), // default di-backend ke now()
  products: Joi.array().min(1).items(productItemSchema).required()
});

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
    login, createStockInSchema, createDistributorValidation, updateDistributor, updateDistributor
}

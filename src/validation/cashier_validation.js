import Joi from 'joi'

// LOGIN
const login = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().max(20).required(), 
})

// CREATE
const createTransactionSchema = Joi.object({
    // Data Customer
    customer: Joi.alternatives().conditional('payment', {
        is: 'credit',
        then: Joi.object({
            id: Joi.number().integer().required(),
            name: Joi.string().optional()
        }).required(),
        otherwise: Joi.object().optional()
    }),

    // Metode Pembayaran
    payment: Joi.string().valid('cash', 'credit', 'transfer', 'qris').required(),

    // Paid Amount (hanya validasi tipe data)
    paidAmount: Joi.number().precision(2).min(0)
        .when('payment', { 
            is: 'credit', 
            then: Joi.required(), 
            otherwise: Joi.forbidden() 
        }),

    // Items
    items: Joi.array().min(1).items(
        Joi.object({
            productId: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required(),
            subtotal: Joi.number().precision(2).min(0).required()
        })
    ).required(),

    // Discount (opsional)
    discountId: Joi.number().integer().optional().allow(null)
}).options({ abortEarly: false });

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

export{
    login, createTransactionSchema, createCustomer, updateCustomer, updateTransaction
}


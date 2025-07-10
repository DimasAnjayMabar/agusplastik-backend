import Joi from 'joi'

// REGISTRASI
const registerAdmin = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().min(6).max(20).required(),
    name : Joi.string().max(100).required(),
    email : Joi.string().max(100).email().optional().allow(null), 
    phone : Joi.string().max(20).optional().allow(null), 
    nik : Joi.string().max(50).required(),
    photoPath : Joi.string().optional().allow(null),
    role : Joi.string().valid("admin").required(), 
    adminId : Joi.string().optional().allow(null)
})

const registerGudang = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().min(6).max(20).required(),
    name : Joi.string().max(100).required(),
    email : Joi.string().max(100).email().optional().allow(null), 
    phone : Joi.string().max(20).optional().allow(null), 
    nik : Joi.string().max(50).required(),
    photoPath : Joi.string().optional().allow(null),
    role : Joi.string().valid("gudang").required(), 
    adminId : Joi.string().optional().allow(null)
})

const registerKasir = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().min(6).max(20).required(),
    name : Joi.string().max(100).required(),
    email : Joi.string().max(100).email().optional().allow(null), 
    phone : Joi.string().max(20).optional().allow(null), 
    nik : Joi.string().max(50).required(),
    photoPath : Joi.string().optional().allow(null),
    role : Joi.string().valid("kasir").required(), 
    adminId : Joi.string().optional().allow(null)
})

// LOGIN 
const login = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string.max(20).required(), 
    role : Joi.string().valid("admin", "kasir", "gudang").required()
})

export{
    registerAdmin, registerGudang, registerKasir, login
}
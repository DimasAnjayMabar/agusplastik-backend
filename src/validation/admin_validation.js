import Joi from 'joi'

// REGISTRASI
const registerStaff = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().min(6).max(20).required(),
    name : Joi.string().max(100).required(),
    email : Joi.string().max(100).email().optional().allow(null), 
    phone : Joi.string().max(20).optional().allow(null), 
    nik : Joi.string().max(50).required(),
    imagePath : Joi.string().optional().allow(null)
})

// LOGIN 
const login = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().max(20).required(), 
})

// UPDATE 
const updateStaffValidation = Joi.object({
    name : Joi.string().max(100).optional(),
    email : Joi.string().max(100).email().optional().allow(null), 
    phone : Joi.string().max(20).optional().allow(null), 
    nik : Joi.string().max(50).optional(),
    photoPath : Joi.string().optional().allow(null),
    shopId : Joi.string().optional().allow(null)
})

const updateAdminValidation = Joi.object({
    name : Joi.string().max(100).optional(),
    email : Joi.string().max(100).email().optional().allow(null), 
    phone : Joi.string().max(20).optional().allow(null), 
    nik : Joi.string().max(50).optional(),
    imagePath : Joi.string().optional().allow(null),
})

const resetPasswordValidation = Joi.object({
    username : Joi.string().max(20).required(),
    password : Joi.string().min(6).max(20).required()
})

export{
    registerStaff, updateStaffValidation, login, updateAdminValidation, resetPasswordValidation
}
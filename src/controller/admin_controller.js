import userService from "../service/admin_service.js"

// ================================= REGISTRASI =================================
const registerAdmin = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.registerAdmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerGudang = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.registerGudang(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerKasir = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.registerKasir(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= LOGIN =================================
const loginAdmin = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.loginAdmin(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}
const loginGudang = async (req, res, next) => {
    try{
        const result = await userService.loginGudang(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const loginKasir = async (req, res, next) => {
    try{
        const result = await userService.loginKasir(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET ALL =================================
const getAllStaff = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.getAllStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET BY ID =================================
const getStaffById = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.getStaffById(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= UPDATE =================================
const updateStaff = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{ 
        const result = await userService.updateStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= SOFT DELETE =================================
const softDeleteStaff = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.softDeleteStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const deactivateSelfAdmin = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await userService.deactivateSelfAdmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

export default {
    registerAdmin, 
    registerGudang, 
    registerKasir, 
    loginAdmin, 
    loginGudang, 
    loginKasir, 
    getAllStaff, 
    getStaffById, 
    updateStaff, 
    softDeleteStaff, 
    deactivateSelfAdmin
}
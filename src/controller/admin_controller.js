import userService from "../service/admin_service.js"

// ================================= REGISTRASI =================================
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

export default {
    registerGudang, 
    registerKasir, 
    loginAdmin, 
    getAllStaff, 
    getStaffById, 
    updateStaff, 
    softDeleteStaff
}
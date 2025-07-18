import adminService from "../service/admin_service.js"

// ================================= REGISTRASI =================================
const registerGudang = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.registerGudang(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerKasir = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.registerKasir(req)

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
        const result = await adminService.loginAdmin(req.body)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET ALL =================================
const getGudangStaff = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.getGudangStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getKasirStaff = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.getKasirStaff(req)

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
        const result = await adminService.getStaffById(req)

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
        const result = await adminService.updateStaff(req)

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
        const result = await adminService.softDeleteStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= TRANSFER =================================
const transferMultipleStaff = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.transferMultipleStaff(req)

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
    getGudangStaff,
    getKasirStaff, 
    getStaffById, 
    updateStaff, 
    softDeleteStaff,
    transferMultipleStaff
}
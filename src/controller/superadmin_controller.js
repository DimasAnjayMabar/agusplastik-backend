import superadminService from "../service/superadmin_service.js";

// ================================= REGISTRASI =================================
const registerSuperadmin = async (req, res, next) => { 
    try{
        const result = await superadminService.registerSuperadmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerAdmin = async (req, res, next) => { 
    try{
        const result = await superadminService.registerAdmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const registerShop = async (req, res, next) => { 
    try{
        const result = await superadminService.registerShop(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= LOGIN =================================
const loginSuperadmin = async (req, res, next) => { 
    try{
        const result = await superadminService.loginSuperadmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const loginSuperadminSilent = async (req, res, next) => { 
    try{
        const result = await superadminService.loginSuperadminSilent(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET ALL =================================
const getAllShop = async (req, res, next) => { 
    try{
        const result = await superadminService.getAllShop(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET BY ID =================================
const getShopAdmin = async (req, res, next) => { 
    try{
        const result = await superadminService.getShopAdmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getStaffGudang = async (req, res, next) => { 
    try{
        const result = await superadminService.getStaffGudang(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getStaffKasir = async (req, res, next) => { 
    try{
        const result = await superadminService.getStaffKasir(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getShopProducts = async (req, res, next) => { 
    try{
        const result = await superadminService.getShopProducts(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= UPDATE =================================
const updateSuperadminProfile = async (req, res, next) => { 
    try{
        const result = await superadminService.updateSuperadminProfile(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateAdmin = async (req, res, next) => { 
    try{
        const result = await superadminService.updateAdmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateStaff = async (req, res, next) => { 
    try{
        const result = await superadminService.updateStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= SOFT DELETE =================================
const softDeleteAdmin = async (req, res, next) => { 
    try{
        const result = await superadminService.softDeleteAdmin(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const softDeleteStaff = async (req, res, next) => { 
    try{
        const result = await superadminService.softDeleteStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= TRANSFER  =================================
const transferAdminToShop = async (req, res, next) => { 
    try{
        const result = await superadminService.transferAdminToShop(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const transferMultipleStaff = async (req, res, next) => { 
    try{
        const result = await superadminService.transferMultipleStaff(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

export default {
    registerSuperadmin, 
  registerAdmin,
  loginSuperadmin, 
    getAllShop,
    getShopAdmin,
  getStaffGudang,
  getStaffKasir, 
  getShopProducts,
  updateSuperadminProfile,
  updateAdmin, 
  updateStaff,
  softDeleteAdmin,
  softDeleteStaff,
  transferAdminToShop,
  transferMultipleStaff,
  registerShop,
  loginSuperadminSilent
}
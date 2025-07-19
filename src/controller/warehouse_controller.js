import warehouseService from "../service/warehouse_service.js"

// ================================= LOGIN =================================
const loginStaffGudang = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.loginStaffGudang(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET ALL =================================
const getShopProducts = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.getShopProducts(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getShopDistributor = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.getShopDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET BY ID =================================
const getProductById = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.getProductById(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getDistributorById = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.getDistributorById(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= CREATE =================================
const createDistributor = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.createDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const createProduct = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.createProduct(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= UPDATE =================================
const updateDistributor = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.updateDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateProduct = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.updateProduct(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateStaffProfile = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.updateStaffProfile(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= DELETE =================================
const deleteDistributor = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.deleteDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const deleteProduct = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await adminService.deleteProduct(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

export default{
    loginStaffGudang,
    getShopProducts,
    getShopDistributor,
    createDistributor,
    createProduct,
    getDistributorById,
    getProductById,
    updateDistributor,
    updateProduct,
    updateStaffProfile,
    deleteDistributor,
    deleteProduct
}
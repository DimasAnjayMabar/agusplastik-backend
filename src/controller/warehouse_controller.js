import warehouseService from "../service/warehouse_service.js"

// ================================= LOGIN =================================
const loginStaffGudang = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.loginStaffGudang(req)

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
        const result = await warehouseService.getShopProducts(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getShopDistributor = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.getShopDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getProductTypes = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.getProductTypes(req)

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
        const result = await warehouseService.getProductById(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getDistributorById = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.getDistributorById(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getStaffProfile = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.getStaffProfile(req)

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
        const result = await warehouseService.createDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const createProduct = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.createProduct(req)

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
        const result = await warehouseService.updateDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateProduct = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.updateProduct(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateStaffProfile = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.updateStaffProfile(req)

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
        const result = await warehouseService.deleteDistributor(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const deleteProduct = async (req, res, next) => { // HANYA UNTUK WEBSITE ADMIN
    try{
        const result = await warehouseService.deleteProduct(req)

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
    getProductTypes,
    createDistributor,
    createProduct,
    getDistributorById,
    getProductById,
    getStaffProfile,
    updateDistributor,
    updateProduct,
    updateStaffProfile,
    deleteDistributor,
    deleteProduct
}
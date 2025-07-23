import cashierService from '../service/cashier_service.js'

// ================================= LOGIN =================================
const loginStaffKasir = async (req, res, next) => {
    try{
        const result = await cashierService.loginStaffKasir(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET ALL =================================
const getAllTransaction = async (req, res, next) => {
    try{
        const result = await cashierService.getAllTransaction(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getAllCustomer = async (req, res, next) => {
    try{
        const result = await cashierService.getAllCustomer(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= GET BY ID =================================
const getTransactionDetail = async (req, res, next) => {
    try{
        const result = await cashierService.getTransactionDetail(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getCustomerDetail = async (req, res, next) => {
    try{
        const result = await cashierService.getCustomerDetail(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const getStaffProfile = async (req, res, next) => {
    try{
        const result = await cashierService.getStaffProfile(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= UPDATE =================================
const updateCustomer = async (req, res, next) => {
    try{
        const result = await cashierService.updateCustomer(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const updateStaffProfile = async (req, res, next) => {
    try{
        const result = await cashierService.updateStaffProfile(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= DELETE =================================
const deleteCustomer = async (req, res, next) => {
    try{
        const result = await cashierService.deleteCustomer(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

// ================================= CREATE =================================
const createTransaction = async (req, res, next) => {
    try{
        const result = await cashierService.createTransaction(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

const createInstallment = async (req, res, next) => {
    try{
        const result = await cashierService.createInstallment(req)

        res.status(200).json({
            data : result
        })
    }catch(e){
        next(e)
    }
}

export default{
    loginStaffKasir,
    getAllTransaction,
    getAllCustomer,
    getTransactionDetail,
    getCustomerDetail,
    getStaffProfile,
    updateCustomer,
    updateStaffProfile,
    deleteCustomer,
    createTransaction,
    createInstallment
}
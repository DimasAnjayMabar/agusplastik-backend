import express from "express"
import { authMiddleware } from "../middleware/auth_middleware.js"
import gudangController from "../controller/warehouse_controller.js"

const gudangRouter = new express.Router()
gudangRouter.post('/login/staff-gudang', gudangController.loginStaffGudang)
gudangRouter.get('/gudang/products', authMiddleware, gudangController.getShopProducts)
gudangRouter.get('/gudang/distributor', authMiddleware, gudangController.getShopDistributor)
gudangRouter.get('/gudang/product-type', authMiddleware, gudangController.getProductTypes)
gudangRouter.post('/gudang/products/create-product', authMiddleware, gudangController.createProduct)
gudangRouter.post('/gudang/distributor/create-distributor', authMiddleware, gudangController.createDistributor)
gudangRouter.get('/gudang/products/:productId', authMiddleware, gudangController.getProductById)
gudangRouter.get('/gudang/distributor/:distributorId', authMiddleware, gudangController.getDistributorById)
gudangRouter.get('/gudang/profile', authMiddleware, gudangController.getStaffProfile)
gudangRouter.patch('/gudang/update-product', authMiddleware, gudangController.updateProduct)
gudangRouter.patch('/gudang/update-distributor', authMiddleware, gudangController.updateDistributor)
gudangRouter.patch('/gudang/update-gudang', authMiddleware, gudangController.updateStaffProfile)
gudangRouter.delete('/gudang/delete-product', authMiddleware, gudangController.deleteProduct)
gudangRouter.delete('/gudang/delete-distributor', authMiddleware, gudangController.deleteDistributor)

export{
    gudangRouter
}
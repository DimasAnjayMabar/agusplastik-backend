import express from "express"
import superAdminController from "../controller/superadmin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const superAdminRouter = new express.Router()
superAdminRouter.post('/registrasi/superadmin', superAdminController.registerSuperadmin)
superAdminRouter.post('/login/superadmin', superAdminController.loginSuperadmin)
superAdminRouter.post('/superadmin/registrasi/admin/:shopId', authMiddleware, superAdminController.registerAdmin)
superAdminRouter.post('/superadmin/registrasi/toko', authMiddleware, superAdminController.registerShop)
superAdminRouter.get('/superadmin/get-all-shop', authMiddleware, superAdminController.getAllShop)
superAdminRouter.get('/superadmin/all-shop/admin/:shopId', authMiddleware, superAdminController.getShopAdmin)
superAdminRouter.get('/superadmin/all-shop/staff/:shopId', authMiddleware, superAdminController.getShopStaffs)
superAdminRouter.get('/superadmin/all-shop/products/:shopId', authMiddleware, superAdminController.getShopProducts)
superAdminRouter.patch('/superadmin/update-superadmin', authMiddleware, superAdminController.updateSuperadminProfile)
superAdminRouter.patch('/superadmin/update-admin/:adminId', authMiddleware, superAdminController.updateAdmin)
superAdminRouter.patch('/superadmin/update-staff/:staffId', authMiddleware, superAdminController.updateStaff)
superAdminRouter.delete('/superadmin/delete-admin/:adminId', authMiddleware, superAdminController.softDeleteAdmin)
superAdminRouter.delete('/superadmin/delete-staff/:staffId', authMiddleware, superAdminController.softDeleteStaff)
superAdminRouter.post('/superadmin/transfer-admin', authMiddleware, superAdminController.transferAdminToShop)
superAdminRouter.post('/superadmin/transfer-staff', superAdminController.transferMultipleStaff)

export{
    superAdminRouter
}
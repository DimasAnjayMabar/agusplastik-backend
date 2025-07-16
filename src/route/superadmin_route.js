import express from "express"
import superAdminController from "../controller/superadmin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const superAdminRouter = new express.Router()
superAdminRouter.post('/registrasi/superadmin', superAdminController.registerSuperadmin)
superAdminRouter.post('/registrasi/admin', authMiddleware, superAdminController.registerAdmin)
superAdminRouter.post('/login/superadmin', superAdminController.loginSuperadmin)
superAdminRouter.get('/superadmin/dashboard', authMiddleware, superAdminController.getAllShop)
superAdminRouter.get('/superadmin/dashboard/admin/:shopId', authMiddleware, superAdminController.getShopAdmin)
superAdminRouter.get('/superadmin/dashboard/staff/:shopId', authMiddleware, superAdminController.getShopStaffs)
superAdminRouter.get('/superadmin/dashboard/products/:shopId', authMiddleware, superAdminController.getShopProducts)
superAdminRouter.patch('/superadmin/update-admin/:adminId', authMiddleware, superAdminController.updateAdmin)
superAdminRouter.patch('/superadmin/update-staff/:staffId', authMiddleware, superAdminController.updateStaff)
superAdminRouter.delete('/superadmin/delete-admin/:adminId', authMiddleware, superAdminController.softDeleteAdmin)
superAdminRouter.delete('/superadmin/delete-staff/:staffId', authMiddleware, superAdminController.softDeleteStaff)
superAdminRouter.post('/superadmin/transfer-admin', authMiddleware, superAdminController.transferAdminToShop)
superAdminRouter.post('/superadmin/transfer-staff', superAdminController.transferMultipleStaff)
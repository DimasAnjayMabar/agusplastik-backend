import express from "express"
import superAdminController from "../controller/superadmin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const superAdminRouter = new express.Router()
superAdminRouter.post('/registrasi/superadmin', superAdminController.registerSuperadmin)
superAdminRouter.post('/registrasi/admin', authMiddleware, superAdminController.registerAdmin)
superAdminRouter.post('/login/superadmin', superAdminController.loginSuperadmin)
superAdminRouter.get('/superadmin/dashboard', authMiddleware, superAdminController.getAllShop)
superAdminRouter.get('/superadmin/dashboard/:id', authMiddleware, superAdminController.getShopDetail)
superAdminRouter.get('/superadmin/admin/:id', authMiddleware, superAdminController.getAdminById)
superAdminRouter.get('/superadmin/staff/:id', authMiddleware, superAdminController.getStaffById)
superAdminRouter.patch('/superadmin/update-admin', authMiddleware, superAdminController.updateAdmin)
superAdminRouter.patch('/superadmin/update-staff', authMiddleware, superAdminController.updateStaff)
superAdminRouter.delete('/superadmin/delete-admin/:id', authMiddleware, superAdminController.softDeleteAdmin)
superAdminRouter.delete('/superadmin/delete-staff/:id', authMiddleware, superAdminController.softDeleteStaff)
superAdminRouter.post('/superadmin/transfer-admin', authMiddleware, superAdminController.transferAdminToShop)
superAdminRouter.post('/superadmin/transfer-staff', superAdminController.transferMultipleStaff)
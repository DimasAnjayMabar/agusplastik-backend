import express from "express"
import adminController from "../controller/admin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const adminRouter = new express.Router()
adminRouter.post('/login/admin', adminController.loginAdmin)
adminRouter.post('/admin/registrasi/staff-gudang', authMiddleware, adminController.registerGudang)
adminRouter.post('/admin/registrasi/staff-kasir', authMiddleware, adminController.registerKasir)
adminRouter.get('/admin/staff-gudang', authMiddleware, adminController.getGudangStaff)
adminRouter.get('/admin/staff-kasir', authMiddleware, adminController.getKasirStaff)
adminRouter.get('/admin/products', authMiddleware, adminController.getAllProduct)
adminRouter.get('/admin/staff/:staffId', authMiddleware, adminController.getStaffById)
adminRouter.get('/admin/products/:productId', authMiddleware, adminController.getProductById)
adminRouter.patch('/admin/update-staff/:staffId', authMiddleware, adminController.updateStaff)
adminRouter.delete('/admin/delete-staff/:staffId', authMiddleware, adminController.softDeleteStaff)
adminRouter.post('/admin/transfer-staff', authMiddleware, adminController.transferMultipleStaff)

export{
    adminRouter
}
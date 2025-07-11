import express from "express"
import adminController from "../controller/admin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const adminRouter = new express.Router()
adminRouter.post('/registrasi/admin', adminController.registerAdmin)
adminRouter.post('/registrasi/gudang', authMiddleware, adminController.registerGudang)
adminRouter.post('/registrasi/kasir', authMiddleware, adminController.registerKasir)
adminRouter.post('/login/admin', adminController.loginAdmin)
adminRouter.post('/login/gudang', adminController.loginGudang)
adminRouter.post('/login/kasir', adminController.loginKasir)
adminRouter.get('/admin/dashboard', authMiddleware, adminController.getAllStaff)
adminRouter.get('/admin/dashboard/:id', authMiddleware, adminController.getStaffById)
adminRouter.patch('/admin/update-staff/:id', authMiddleware, adminController.updateStaff)
adminRouter.delete('/admin/delete-staff/:id', authMiddleware, adminController.softDeleteStaff)
adminRouter.delete('/admin/deactivate-account/:id', authMiddleware, adminController.deactivateSelfAdmin)

export{
    adminRouter
}
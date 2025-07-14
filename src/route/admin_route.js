import express from "express"
import adminController from "../controller/admin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const adminRouter = new express.Router()
adminRouter.post('/registrasi/gudang', authMiddleware, adminController.registerGudang)
adminRouter.post('/registrasi/kasir', authMiddleware, adminController.registerKasir)
adminRouter.post('/login/admin', adminController.loginAdmin)
adminRouter.get('/admin/dashboard', authMiddleware, adminController.getAllStaff)
adminRouter.get('/admin/dashboard/:id', authMiddleware, adminController.getStaffById)
adminRouter.patch('/admin/update-staff/:id', authMiddleware, adminController.updateStaff)
adminRouter.delete('/admin/delete-staff/:id', authMiddleware, adminController.softDeleteStaff)

export{
    adminRouter
}
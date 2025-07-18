import express from "express"
import adminController from "../controller/admin_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const adminRouter = new express.Router()
adminRouter.post('/login/admin', adminController.loginAdmin)
adminRouter.post('/admin/registrasi/gudang', authMiddleware, adminController.registerGudang)
adminRouter.post('/admin//registrasi/kasir', authMiddleware, adminController.registerKasir)
adminRouter.get('/admin/staff-gudang', authMiddleware, adminController.getGudangStaff)
adminRouter.get('/admin/staff-kasir', authMiddleware, adminController.getKasirStaff)
adminRouter.get('/admin/staff/:id', authMiddleware, adminController.getStaffById)
adminRouter.patch('/admin/update-staff/:id', authMiddleware, adminController.updateStaff)
adminRouter.delete('/admin/delete-staff/:id', authMiddleware, adminController.softDeleteStaff)
adminRouter.post('/admin/transfer-staff', authMiddleware, adminController.transferMultipleStaff)

export{
    adminRouter
}
import express from "express"
import adminController from "../controller/admin_controller.js"

const adminRouter = new express.Router()
adminRouter.post('/registrasi/admin', adminController.registerAdmin)
adminRouter.post('/registrasi/gudang', adminController.registerGudang)
adminRouter.post('/registrasi/kasir', adminController.registerKasir)
adminRouter.post('/login/admin', adminController.loginAdmin)
adminRouter.post('/login/gudang', adminController.loginGudang)
adminRouter.post('/login/kasir', adminController.loginKasir)
adminRouter.get('/admin/dashboard', adminController.getAllStaff)
adminRouter.get('/admin/dashboard/:id', adminController.getStaffById)
adminRouter.patch('/admin/update-staff/:id', adminController.updateStaff)
adminRouter.delete('/admin/delete-staff/:id', adminController.softDeleteStaff)
adminRouter.delete('/admin/deactivate-account/:id', adminController.deactivateSelfAdmin)
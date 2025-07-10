import express from "express"
import userController from "../controller/user_controller.js"

const userRouter = new express.Router()
userRouter.post('/registrasi/admin', userController.registerAdmin)
userRouter.post('/registrasi/gudang', userController.registerGudang)
userRouter.post('/registrasi/kasir', userController.registerKasir)
userRouter.post('/login/admin', userController.loginAdmin)
userRouter.post('/login/gudang', userController.loginGudang)
userRouter.post('/login/kasir', userController.loginKasir)
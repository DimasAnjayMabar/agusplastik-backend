import express from "express"
import cashierController from "../controller/cashier_controller.js"
import { authMiddleware } from "../middleware/auth_middleware.js"

const cashierRouter = new express.Router()
cashierRouter.post('/login/staff-kasir', cashierController.loginStaffKasir)
cashierRouter.get('/kasir/transactions', authMiddleware, cashierController.getAllTransaction)
cashierRouter.get('/kasir/customers', authMiddleware, cashierController.getAllCustomer)
cashierRouter.get('/kasir/transactions/:transactionId', authMiddleware, cashierController.getTransactionDetail)
cashierRouter.get('/kasir/customers/:customerId', authMiddleware, cashierController.getCustomerDetail)
cashierRouter.get('/kasir/profile', authMiddleware, cashierController.getStaffProfile)
cashierRouter.patch('/kasir/update-customer/:customerId', authMiddleware, cashierController.updateCustomer)
cashierRouter.patch('/kasir/update-kasir', authMiddleware, cashierController.updateStaffProfile)
cashierRouter.delete('/kasir/delete-customer/:customerId', authMiddleware, cashierController.deleteCustomer)
cashierRouter.post('/kasir/transactions/create-transaction', authMiddleware, cashierController.createTransaction)
cashierRouter.post('/kasir/transactions/create-installment', authMiddleware, cashierController.createInstallment)

export{
    cashierRouter
}
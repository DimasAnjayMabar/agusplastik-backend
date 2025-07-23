import express from 'express';
import cors from 'cors';
import { superAdminRouter } from '../route/superadmin_route.js'
import { adminRouter } from '../route/admin_route.js'
import { gudangRouter } from '../route/warehouse_route.js'
import { errorMiddleware } from "../middleware/error_middleware.js"
import { cashierRouter } from '../route/cashier_route.js';

export const web = express();
web.use(express.json());
web.use(cors());

web.use(superAdminRouter)
web.use(adminRouter)
web.use(gudangRouter)
web.use(cashierRouter)

web.use(errorMiddleware);

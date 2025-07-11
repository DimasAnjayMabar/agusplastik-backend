import express from 'express';
import cors from 'cors';
import { adminRouter } from '../route/admin_route.js'
import { errorMiddleware } from "../middleware/error_middleware.js"

export const web = express();
web.use(express.json());
web.use(cors());

web.use(adminRouter)

web.use(errorMiddleware);

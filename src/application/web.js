import express from 'express';
import cors from 'cors';
import {adminRouter} from '../route/admin_route.js'

export const web = express();
web.use(express.json());
web.use(cors());

web.use(adminRouter)
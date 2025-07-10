import express from 'express';
import cors from 'cors';
import {userRouter} from '../route/user_route.js'

export const web = express();
web.use(express.json());
web.use(cors());

web.use(userRouter)
import express from 'express' 
import {createOrder} from '../controller/payment.js'
import { verifyToken } from '../middleweres/auth.js'

const router = express.Router()

router.post('/create-order', verifyToken ,  createOrder)


export default router
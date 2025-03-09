import express from 'express' 
import {createOrder} from '../controller/payment.js'

const router = express.Router()

router.post('/create-order', createOrder)


export default router
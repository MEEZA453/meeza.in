import express from 'express' 
import {getCart , postCart , deleteCart, updateCartItem} from '../controller/cart.js';
const router = express.Router();

router.get('/' , getCart);
router.post('/postcart' , postCart);
router.delete('/deletecart/:id' , deleteCart)
router.put('/update/:id' , updateCartItem)

export default router
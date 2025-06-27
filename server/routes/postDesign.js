import express from 'express'
import {getDesign , postDesign , deleteDesign} from '../controller/design.js'
const router = express.Router()

router.get('/allproducts' ,getDesign ) ;
router.post('/post' , postDesign) ;
router.delete('/delete/:id', deleteDesign); ;

export default router

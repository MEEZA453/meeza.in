import express from 'express'
import {getDesign , postDesign , deleteDesign , pingServer}  from '../controller/design.js'
const router = express.Router()

router.get('/allproducts' ,getDesign ) ;
router.get("/ping", pingServer);

router.post('/post' , postDesign) ;
router.delete('/delete/:id', deleteDesign); ;

export default router

import express from 'express'
import {getDesign , postDesign , deleteDesign , pingServer, searchDesigns, getDefaultDesigns}  from '../controller/design.js'
import { verifyToken } from '../middleweres/auth.js';
const router = express.Router()

router.get('/allproducts' ,getDesign ) ;
router.get("/ping", pingServer);
router.get("/defaultSearch", getDefaultDesigns);

router.post('/post' ,verifyToken, postDesign) ;
router.delete('/delete/:id', deleteDesign); 
router.get("/search/designs", searchDesigns);

export default router

import express from 'express'
import {getDesign , postDesign , deleteDesign , pingServer, searchDesigns, getDefaultDesigns, editDesign, getDesignById, getDesignByHandle, addProductView}  from '../controller/design.js'
import { verifyToken } from '../middleweres/auth.js';
import { getPostsOfAsset } from '../controller/post.js';
const router = express.Router()

router.get('/allproducts' , verifyToken, getDesign ) ;
router.get("/ping", pingServer);
router.put("/edit/:id", verifyToken, editDesign); 
router.get("/defaultSearch",  verifyToken , getDefaultDesigns);
router.get("/asset/:assetId/posts", getPostsOfAsset);
router.get("/assetById/:id", verifyToken, getDesignById);
router.post("/view/:id", verifyToken, addProductView);
// Get single product by HANDLE
router.get("/assetByHandle/:handle", getDesignByHandle);
router.post('/post' ,verifyToken, postDesign) ;
router.delete('/delete/:id', deleteDesign); 
router.get("/search/designs",verifyToken , searchDesigns);

export default router

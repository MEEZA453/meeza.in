import { verifyToken , verifyIsUser} from "../middleweres/auth.js";
import express from "express";

import {addToFavorites , removeFromFavorites , getFavoritesByHandle, getPostAppreciations} from '../controller/favourait.js'
const router = express.Router();
router.post('/favorites/add', verifyToken, addToFavorites);
router.post('/favorites/remove', verifyToken, removeFromFavorites);
router.get('/favoritesByHandle/:handle', verifyIsUser, getFavoritesByHandle);

// router.get('/appreciations/:postId', verifyToken, getPostAppreciations);
// router.get('/favorites', verifyToken, getFavorites);


export default router
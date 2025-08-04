import { verifyToken } from "../middleweres/auth.js";
import express from "express";

import {addToFavorites , removeFromFavorites , getFavorites} from '../controller/favourait.js'
const router = express.Router();
router.post('/favorites/add', verifyToken, addToFavorites);
router.post('/favorites/remove', verifyToken, removeFromFavorites);
router.get('/favorites', verifyToken, getFavorites);

export default router

import { addToPromotion, getAllPromotion, removeFromPromotion } from "../controller/promotion.js";
import { verifyToken , verifyIsUser} from "../middleweres/auth.js";
import express from "express";


const router = express.Router();
router.get('/getPromotion', verifyIsUser, getAllPromotion);
router.post('/add', verifyToken, addToPromotion);
router.post('/remove', verifyToken, removeFromPromotion);
// router.get('/favorites', verifyToken, getFavorites);


export default router
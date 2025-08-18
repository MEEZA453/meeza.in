import { addToHighlight, getAllHighlights, removeFromHighlight } from "../controller/highlight.js";
import { verifyToken , verifyIsUser} from "../middleweres/auth.js";
import express from "express";


const router = express.Router();
router.post('/add', verifyToken, addToHighlight);
router.post('/remove', verifyToken, removeFromHighlight);
router.get('/getHighlight', verifyIsUser, getAllHighlights);
// router.get('/favorites', verifyToken, getFavorites);


export default router
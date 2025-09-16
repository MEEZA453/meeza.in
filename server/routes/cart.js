import express from "express";
import { addToCart, removeFromCart, getUserCart, clearCart } from "../controller/cart.js";
import { verifyToken } from "../middleweres/auth.js";


const router = express.Router();

router.post("/add", verifyToken, addToCart);
router.post("/remove", verifyToken, removeFromCart);
router.get("/", verifyToken, getUserCart);
router.delete("/clear", verifyToken, clearCart);

export default router;

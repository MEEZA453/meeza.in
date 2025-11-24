import express from "express";
import { addToHotList, removeFromHotList, getAllHotProducts } from "../controller/hotlist.js";
import { verifyToken } from "../middleweres/auth.js";

const router = express.Router();

// ✅ Only dev users can modify hot list
router.post("/add", verifyToken, addToHotList);
router.post("/remove", verifyToken, removeFromHotList);

// ✅ Anyone can get all hot products
router.get("/getAll",verifyToken, getAllHotProducts);

export default router;



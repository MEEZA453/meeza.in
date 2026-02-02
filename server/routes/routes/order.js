// routes/orderRoutes.js
import express from "express";
import { unlockFreeProduct, downloadProduct } from "../controller/order.js";
import {verifyToken} from '../middleweres/auth.js'

const router = express.Router();

router.post("/:productId/unlock", verifyToken, unlockFreeProduct); // user clicks "Get Now"
router.get("/:productId/download", downloadProduct); // frontend calls with ?token=...

export default router;

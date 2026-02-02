import express from "express";
import { verifyToken } from "../middleweres/auth.js";
import { getWalletBalance, getWalletTransactions } from "../controller/wallet.js";

const router = express.Router();

router.get("/balance", verifyToken, getWalletBalance);
router.get("/transactions", verifyToken, getWalletTransactions);

export default router;

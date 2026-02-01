import express from "express";
import {
    createRazorpayAccount,
  createStripeConnectAccount,
  stripeConnectReturn,
} from "../controller/connect.js";
import { verifyToken } from "../middleweres/auth.js";

const router = express.Router();

router.post("/stripe", verifyToken, createStripeConnectAccount);
router.get("/stripe/return", verifyToken, stripeConnectReturn);
router.post("/razorpay", verifyToken, createRazorpayAccount);
export default router;

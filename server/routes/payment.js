import express from "express";
import { createPaypalOrder, capturePaypalOrder, createOrder, capturePayment, connectRazorpayAccount, withdrawBalance, getWallet } from "../controller/payment.js";
import {verifyToken} from "../middleweres/auth.js";

const router = express.Router();

router.post("/paypal/create", verifyToken, createPaypalOrder);
router.post("/paypal/capture", verifyToken, capturePaypalOrder);
router.post("/razorpay/create", verifyToken, createOrder);
router.post("/razorpay/capture", verifyToken, capturePayment);
router.post("/razorpay/connect", verifyToken, connectRazorpayAccount);
router.post("/razorpay/withdraw", verifyToken, withdrawBalance);
router.get("/razorpay/wallet", verifyToken, getWallet);



// Callback endpoint (Razorpay redirects here after seller approves)
// router.get("/razorpay/callback", verifyToken, razorpayConnectCallback);

export default router;

import express from "express";
import { createPaypalOrder, capturePaypalOrder,createRazorpayOrder, captureRazorpayPayment } from "../controller/payment.js";
import {verifyToken} from "../middleweres/auth.js";

const router = express.Router();

router.post("/paypal/create", verifyToken, createPaypalOrder);
router.post("/paypal/capture", verifyToken, capturePaypalOrder);
router.post("/razorpay/create", verifyToken, createRazorpayOrder);
router.post("/razorpay/capture", verifyToken, captureRazorpayPayment);
export default router;

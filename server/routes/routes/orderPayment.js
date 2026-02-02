// routes/orderPaymentRoutes.js
import express from "express";
import {
  createProductOrder,
  createStripePaymentIntentForOrder,
  verifyProductPayment,
} from "../controller/orderPayment.js";
import { verifyToken } from "../middleweres/auth.js";

const router = express.Router();

router.post("/create-order", verifyToken, createProductOrder);
router.post("/stripe/payment-intent", verifyToken, createStripePaymentIntentForOrder);
router.post("/verify", verifyToken, verifyProductPayment);

export default router;

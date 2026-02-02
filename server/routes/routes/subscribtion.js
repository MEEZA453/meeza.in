import express from "express";
import {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getSubscriptionStatus,
  createStripePaymentIntent,
} from "../controller/subscribtion.js";
import {verifyToken}  from "../middleweres/auth.js";

const router = express.Router();
router.post("/create-order",verifyToken , createSubscriptionOrder);
router.post("/verify", verifyToken, verifySubscriptionPayment);
router.get("/status", verifyToken, getSubscriptionStatus);
router.post(
  "/stripe/payment-intent",
  verifyToken,
  createStripePaymentIntent
);
export default router;

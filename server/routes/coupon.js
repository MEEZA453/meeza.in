import express from "express";
import { verifyToken, verifyIsDev } from "../middleweres/auth.js";
import {
  applyCoupon,
  createCoupon,
  filterCoupons,
  getAllCoupons,
  toggleCoupon,
  updateCoupon,
  getCouponById,
} from "../controller/coupon.js";
import Coupon from "../models/coupon.js";

const router = express.Router();

/* ===============================
   DEV ROUTES
================================= */

router.post("/coupon", verifyToken, verifyIsDev, createCoupon);

router.patch("/coupon/:id/toggle", verifyToken, verifyIsDev, toggleCoupon);

router.put("/coupon/:id", verifyToken, verifyIsDev, updateCoupon);

router.patch("/coupon/:id/disable", verifyToken, verifyIsDev, async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: "Coupon not found" });
  }

  coupon.isActive = false;
  await coupon.save();

  res.json({ success: true });
});

router.delete("/coupon/:id", verifyToken, verifyIsDev, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

router.get("/coupons/filter", verifyToken, verifyIsDev, filterCoupons);

/* ===============================
   USER ROUTES
================================= */

// Apply coupon
router.post("/coupon/apply", verifyToken, applyCoupon);

// Get all coupons (if needed public or dev-only)
router.get("/coupons", verifyToken, getAllCoupons);

// Get coupon by ID
router.get("/coupon/:id", verifyToken, verifyIsDev, getCouponById);

export default router;

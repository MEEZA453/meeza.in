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

// POST /coupon
router.post("/", verifyToken, verifyIsDev, createCoupon);

// PATCH /coupon/:id/toggle
router.patch("/:id/toggle", verifyToken, verifyIsDev, toggleCoupon);

// PUT /coupon/:id
router.put("/:id", verifyToken, verifyIsDev, updateCoupon);

// PATCH /coupon/:id/disable
router.patch("/:id/disable", verifyToken, verifyIsDev, async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    return res.status(404).json({ success: false, message: "Coupon not found" });
  }

  coupon.isActive = false;
  await coupon.save();

  res.json({ success: true });
});

// DELETE /coupon/:id
router.delete("/:id", verifyToken, verifyIsDev, async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// GET /coupon/coupons
router.get("/coupons", verifyToken, getAllCoupons);

// GET /coupon/coupons/filter
router.get("/coupons/filter", verifyToken, verifyIsDev, filterCoupons);

// GET /coupon/:id
router.get("/:id", verifyToken, verifyIsDev, getCouponById);

/* ===============================
   USER ROUTE
================================= */

// POST /coupon/apply
router.post("/apply", verifyToken, applyCoupon);

export default router;

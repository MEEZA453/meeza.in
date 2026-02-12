import Coupon from "../models/coupon.js";
import CreditTransaction from "../models/credit.js";
import User from "../models/user.js";

export const applyCoupon = async (req, res) => {
  const { code } = req.body;
  const user = await User.findById(req.user.id);

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return res.status(400).json({ success: false, message: "Invalid coupon" });
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({ success: false, message: "Coupon expired" });
  }

  if (coupon.usedCount >= coupon.maxUses) {
    return res.status(400).json({ success: false, message: "Coupon limit reached" });
  }

  // 🟢 FREE CREDITS
  if (coupon.type === "FREE_CREDITS") {
    user.credits += coupon.credits;
    await user.save();

    coupon.usedCount += 1;
    await coupon.save();

    await CreditTransaction.create({
      user: user._id,
      type: "ADD",
      amount: coupon.credits,
      reason: "COUPON",
      reference: coupon._id.toString(),
      balanceAfter: user.credits,
    });

    return res.json({
      success: true,
      message: "Credits added",
      creditsAdded: coupon.credits,
      currentCredits: user.credits,
    });
  }

  // 🟡 SUBSCRIPTION DISCOUNT
  return res.json({
    success: true,
    type: "SUBSCRIPTION_DISCOUNT",
    discountPercent: coupon.discountPercent,
    discountAmount: coupon.discountAmount,
  });
};
export const createCoupon = async (req, res) => {
  const {
    code,
    type,
    discountPercent,
    discountAmount,
    credits,
    maxUses,
    expiresAt,
  } = req.body;

  const coupon = await Coupon.create({
    code,
    type,
    discountPercent,
    discountAmount,
    credits,
    maxUses,
    expiresAt,
    createdBy: req.user._id,
  });
console.log('coupon created successfully ',coupon)
  res.json({
    success: true,
    coupon,
  });
};
export const getCouponById = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id)
    .populate("createdBy", "name email");

  if (!coupon) {
    return res.status(404).json({
      success: false,
      message: "Coupon not found",
    });
  }

  res.json({
    success: true,
    coupon,
  });
};

export const getAllCoupons = async (req, res) => {
  const coupons = await Coupon.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "name email");

  res.json({
    success: true,
    count: coupons.length,
    coupons,
  });
};
export const filterCoupons = async (req, res) => {
  const { type, isActive, expired } = req.query;

  const query = {};

  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (expired === "true") {
    query.expiresAt = { $lt: new Date() };
  }

  const coupons = await Coupon.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    coupons,
  });
};
export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
console.log('toggling the coupon :', coupon?._id)
  if (!coupon) {
    return res.status(404).json({ success: false });
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();
console.log('coupon status', coupon.isActive)
  res.json({
    success: true,
    isActive: coupon.isActive,
  });
};export const updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    coupon,
  });
};


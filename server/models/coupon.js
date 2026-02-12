import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },

  type: {
    type: String,
    enum: ["DISCOUNT_PERCENT", "CREDITS", "DISCOUNT_AMOUNT"],
    required: true,
  },

  discountPercent: Number,
  discountAmount: Number,

  credits: Number,

  maxUses: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },

  expiresAt: Date,
  isActive: { type: Boolean, default: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

export default mongoose.model("Coupon", couponSchema);

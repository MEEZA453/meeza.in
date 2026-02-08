// models/HighlightRequest.js
import mongoose from "mongoose";

const highlightRequestSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  durationHours: { type: Number, required: true }, // hours requested
  priceUSD: { type: Number, default: 0 }, // store in USD for business logic
  currency: { type: String, default: "USD" },
  // gateway: { type: String, enum: ["stripe", "razorpay", "manual"], default: "stripe" },
  status: {
    type: String,
    enum: ["PENDING_PAYMENT", "PAID", "PENDING_APPROVAL", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED","AWAITING_PAYMENT"],
    default: "PENDING_PAYMENT"
  },
  // scheduling
  startsAt: { type: Date },
  expiresAt: { type: Date },

  // payment fields
  stripePaymentIntentId: { type: String, sparse: true },
  razorpayOrderId: { type: String, sparse: true },
  razorpayPaymentId: { type: String, sparse: true },

  createdAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },

  // helpful for queue ordering
  position: { type: Number, default: 0 },

  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
});

highlightRequestSchema.index({ status: 1, createdAt: 1 });
highlightRequestSchema.index({ startsAt: 1, expiresAt: 1 });

export default mongoose.model("HighlightRequest", highlightRequestSchema);

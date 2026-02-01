// models/PayoutRequest.js
import mongoose from "mongoose";

const payoutRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true }, // normalized currency (USD)
    currency: { type: String, default: "USD" },
    gateway: { type: String, enum: ["stripe", "razorpay"], required: true },
    destinationAccountId: { type: String }, // stripeAccountId or razorpayAccountId
    status: { type: String, enum: ["PENDING", "PROCESSING", "PAID", "FAILED"], default: "PENDING" },
    gatewayPayoutId: String,
    meta: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.PayoutRequest || mongoose.model("PayoutRequest", payoutRequestSchema);

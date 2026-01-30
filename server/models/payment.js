// models/Payment.js
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // seller
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    gateway: { type: String, enum: ["stripe", "razorpay"], required: true },
    gatewayPaymentId: String,
    meta: { type: Object }, // optional raw gateway metadata
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    amount: { type: Number, required: true }, // amount in order currency
    currency: { type: String, required: true, default: "USD" }, // 'USD' or 'INR'
    amountUSD: { type: Number }, // helpful for normalization (optional)
    gateway: { type: String, enum: ["stripe", "razorpay"], required: true },

    // Payment details
    status: {
      type: String,
      enum: ["free", "pending", "paid", "failed"],
      default: "pending",
    },

    // Razorpay fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,

    // Stripe fields
    stripePaymentIntentId: String,

    // Seller snapshot (so we don't rely only on product->postedBy later)
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);

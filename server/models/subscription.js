import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  plan: { type: String, enum: ["monthly", "yearly"], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },

  startDate: Date,
  endDate: Date,

  status: {
    type: String,
    enum: ["PENDING", "SCHEDULED", "ACTIVE", "EXPIRED", "CANCELLED"],
    default: "PENDING",
  },

  gateway: {
    type: String,
    enum: ["stripe", "razorpay"],
    required: true,
  },

  // Razorpay
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // Stripe
  stripeSessionId: String,
  stripePaymentIntentId: String,

}, { timestamps: true });

export default mongoose.models.Subscription ||
  mongoose.model("Subscription", subscriptionSchema);

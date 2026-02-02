// models/WalletTransaction.js
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true }, // store normalized currency amount (e.g. USD) OR store currency with amount
    currency: { type: String, default: "USD" }, // choose USD as normalized; you used toUSD in logic
    reference: { type: String }, // paymentId or payoutId
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "SUCCESS" },
    product: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // optional
      name: String,
      amount: Number,
      image: String,
    },
    purchasedBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      handle: String,
      name: String,
      profile:String,
      email: String,
    },
    // balance after this transaction (useful for quick reconciliation)
    balanceAfter: { type: Number },
    gateway: { type: String, enum: ["stripe", "razorpay", "internal"], default: "internal" },
  },
  { timestamps: true }
);

// optional index to help idempotency checks (reference + user + type)
walletTransactionSchema.index({ reference: 1, user: 1, type: 1 }, { unique: false });

export default mongoose.models.WalletTransaction || mongoose.model("WalletTransaction", walletTransactionSchema);

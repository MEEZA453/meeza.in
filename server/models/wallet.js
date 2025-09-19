import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    reference: String, // paymentId or payoutId
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "SUCCESS" },
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTransactionSchema);

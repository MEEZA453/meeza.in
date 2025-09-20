import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["CREDIT", "DEBIT"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    reference: String, // paymentId or payoutId
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "SUCCESS" },
    product: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // optional
      name: String,
      amount: Number,
      image: String,
    },
    purchasedBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      handle : String,
      name: String,
      email: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTransactionSchema);

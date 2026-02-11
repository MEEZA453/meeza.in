import mongoose from "mongoose";

const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["ADD", "DEDUCT"],
    required: true,
  },

  amount: { type: Number, required: true },

  reason: {
    type: String,
    enum: [
      "COUPON",
      "PREMIUM_FEATURE",
      "ADMIN_ADJUSTMENT",
    ],
    required: true,
  },

  reference: String, // postId / couponId / subscriptionId

  balanceAfter: Number,
}, { timestamps: true });

export default mongoose.model("CreditTransaction", creditTransactionSchema);

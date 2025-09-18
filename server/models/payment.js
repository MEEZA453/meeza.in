import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderId: { type: String, required: true },   // PayPal orderId
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: { type: String, enum: ["CREATED", "COMPLETED", "FAILED"], default: "CREATED" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

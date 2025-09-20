import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true }],
    sellers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    orderId: { type: String, required: true },
    paymentId: String,
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["CREATED", "COMPLETED", "FAILED"], default: "CREATED" },
  },
  { timestamps: true }
);


export default mongoose.model("Payment", paymentSchema);

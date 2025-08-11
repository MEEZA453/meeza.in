// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentIntentId: String, // Stripe Payment Intent ID
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

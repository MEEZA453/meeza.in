import mongoose from "mongoose";

const productViewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    weight: {
      type: Number,
      default: 1, // owner = 0
    },
    ipHash: String,
    userAgent: String,
  },
  { timestamps: false }
);

// 🔥 prevent duplicates
productViewSchema.index({ product: 1, viewer: 1 });

export default mongoose.model("ProductView", productViewSchema);

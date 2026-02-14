// models/Purchase.js
import mongoose from "mongoose";

const deliveredAssetSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
  name: String,
  size: Number,
  extension: String,
  key: String, // buyer copy S3 key
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  deliveredAssets: [deliveredAssetSchema],
  totalAmount: Number,
}, { timestamps: true });

export default mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);

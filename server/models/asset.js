// models/Asset.js
import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },                // display name
  originalFileName: { type: String },
  key: { type: String, required: true },                 // s3 key
  size: { type: Number, required: true },                // bytes
  mimeType: { type: String },
  extension: { type: String },
folders: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: "AssetFolder"
}],
  isDocumented: { type: Boolean, default: false },      // used in product(s)
  isMyAsset: { type: Boolean, default: true },          // seller's private asset flag
  storageStatus: { type: String, enum: ["draft","published"], default: "draft" },
  documents: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      productName: String,
      productMediaPreview: Object, // e.g. { url, type }
      snapshotAt: Date,
    }
  ],
}, { timestamps: true });

assetSchema.index({ owner: 1 });

export default mongoose.models.Asset || mongoose.model("Asset", assetSchema);

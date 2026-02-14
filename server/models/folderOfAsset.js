// models/AssetFolder.js
import mongoose from "mongoose";

const assetFolderSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "AssetFolder", default: null },
  totalSize: { type: Number, default: 0 },
  assetCount: { type: Number, default: 0 }
}, { timestamps: true });

assetFolderSchema.index({ owner: 1 });

export default mongoose.models.AssetFolder || mongoose.model("AssetFolder", assetFolderSchema);

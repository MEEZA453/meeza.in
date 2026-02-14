// controllers/assetController.js
import Asset from "../models/asset.js";
import AssetFolder from "../models/folderOfAsset.js";
import User from "../models/user.js";
import Product from "../models/designs.js";
import { generatePresignedUpload, copyObject, deleteObject, headObject } from "../services/s3Client.js";
import path from "path";
import mongoose from "mongoose";

function makeKeyForUser(userId, fileName) {
  // e.g. users/{userId}/assets/{timestamp}-{sanitizedFilename}
  const stamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9\.\-_]/g, "-");
  return `users/${userId}/assets/${stamp}-${safe}`;
}

export const getPresignedForAsset = async (req, res) => {
  try {
    const { fileName, contentType, folder, expectedSize } = req.body;
    if (!fileName || !contentType) {
      return res.status(400).json({ message: "fileName and contentType required" });
    }
    const key = makeKeyForUser(req.user.id, fileName);
    const result = await generatePresignedUpload({ key, contentType, expires: Number(process.env.PRESIGN_EXPIRES || 600) });
    return res.json({ key: result.key, url: result.url });
  } catch (err) {
    console.error("getPresignedForAsset:", err);
    res.status(500).json({ message: "Failed to generate presigned URL" });
  }
};

// After client uploads to S3, it calls this endpoint to create Asset doc
export const createAssetRecord = async (req, res) => {
  try {
    const { key, name, originalFileName, size, mimeType, folderId } = req.body;
    if (!key || !name || !size) return res.status(400).json({ message: "key, name and size required" });

    // Basic head check to confirm file exists (optional)
    try {
      await headObject({ key });
    } catch (e) {
      console.warn("headObject failed; continuing. Client might still be uploading.");
    }

    const extension = path.extname(originalFileName || name).replace(".", "").toLowerCase();

    const newAsset = new Asset({
      owner: req.user.id,
      name,
      originalFileName: originalFileName || name,
      key,
      size: Number(size),
      mimeType,
      extension,
      folder: folderId || null,
      isDocumented: false,
      storageStatus: "draft"
    });

    await newAsset.save();

    // increment user storageUsed
    await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: Number(size) } });

    // update folder counts if folderId provided
    if (folderId) {
      await AssetFolder.findByIdAndUpdate(folderId, { $inc: { totalSize: Number(size), assetCount: 1 } });
    }

    return res.status(201).json({ success: true, asset: newAsset });
  } catch (err) {
    console.error("createAssetRecord err:", err);
    res.status(500).json({ message: "Failed to create asset record" });
  }
};

export const renameAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { newName } = req.body;
    if (!newName) return res.status(400).json({ message: "newName required" });

    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    if (String(asset.owner) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

    asset.name = newName;
    await asset.save();

    // Update product snapshots: find products where this asset is referenced and update snapshot.name
    await Product.updateMany(
      { "assets.assetId": asset._id },
      { $set: { "assets.$[elem].snapshot.name": newName } },
      { arrayFilters: [{ "elem.assetId": asset._id }] }
    );

    return res.json({ success: true, asset });
  } catch (err) {
    console.error("renameAsset err:", err);
    res.status(500).json({ message: "Rename failed" });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { assetId } = req.params;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    if (String(asset.owner) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

    // if used in products, decide policy. We'll allow delete but detach references.
    await Product.updateMany(
      { "assets.assetId": asset._id },
      { $pull: { assets: { assetId: asset._id } } }
    );

    // delete from S3
    await deleteObject({ key: asset.key });

    // update user storageUsed and folder stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { storageUsed: -asset.size } });
    if (asset.folder) {
      await AssetFolder.findByIdAndUpdate(asset.folder, { $inc: { totalSize: -asset.size, assetCount: -1 } });
    }

    await asset.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    console.error("deleteAsset err:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};

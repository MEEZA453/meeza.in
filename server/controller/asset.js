// controllers/assetController.js
import Asset from "../models/asset.js";
import AssetFolder from "../models/folderOfAsset.js";
import User from "../models/user.js";
import Product from "../models/designs.js";
import { generatePresignedUpload, copyObject, deleteObject, headObject } from "../services/s3Client.js";
import path from "path";
import mongoose from "mongoose";
export const addAssetsToFolders = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const ownerId = req.user.id;
    let { assetIds, folderIds } = req.body;

    if (!Array.isArray(assetIds) || !assetIds.length)
      return res.status(400).json({ message: "assetIds required" });

    if (!Array.isArray(folderIds) || !folderIds.length)
      return res.status(400).json({ message: "folderIds required" });

    assetIds = assetIds.filter(id => mongoose.isValidObjectId(id));
    folderIds = folderIds.filter(id => mongoose.isValidObjectId(id));

    session.startTransaction();

    const assets = await Asset.find({
      _id: { $in: assetIds },
      owner: ownerId
    }).session(session);

    const folders = await AssetFolder.find({
      _id: { $in: folderIds },
      owner: ownerId
    }).session(session);

    if (!assets.length || !folders.length)
      throw new Error("Assets or folders not found");

    for (const asset of assets) {

      const existingFolderIds = asset.folders.map(f => String(f));

      const newFolders = folderIds.filter(
        id => !existingFolderIds.includes(String(id))
      );

      // 🚫 Already connected → skip
      if (newFolders.length === 0) continue;

      await Asset.findByIdAndUpdate(asset._id, {
        $addToSet: { folders: { $each: newFolders } }
      }).session(session);

      const totalSize = asset.size || 0;

      for (const folderId of newFolders) {
        await AssetFolder.findByIdAndUpdate(folderId, {
          $inc: { assetCount: 1, totalSize }
        }).session(session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: err.message });
  }
};

export const removeAssetsFromFolders = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const ownerId = req.user.id;
    let { assetIds, folderIds } = req.body;
console.log('removing asset ', assetIds, folderIds)
    if (!Array.isArray(assetIds) || !assetIds.length)
      return res.status(400).json({ message: "assetIds required" });

    if (!Array.isArray(folderIds) || !folderIds.length)
      return res.status(400).json({ message: "folderIds required" });

    assetIds = assetIds.filter(id => mongoose.isValidObjectId(id));
    folderIds = folderIds.filter(id => mongoose.isValidObjectId(id));

    session.startTransaction();

    const assets = await Asset.find({
      _id: { $in: assetIds },
      owner: ownerId
    }).session(session);

    for (const asset of assets) {
      const foldersToRemove = asset.folders.filter(f =>
        folderIds.includes(String(f))
      );

      if (!foldersToRemove.length) continue;

      await Asset.findByIdAndUpdate(asset._id, {
        $pull: { folders: { $in: folderIds } }
      }).session(session);

      const totalSize = asset.size || 0;

      for (const folderId of foldersToRemove) {
        await AssetFolder.findByIdAndUpdate(folderId, {
          $inc: { assetCount: -1, totalSize: -totalSize }
        }).session(session);
      }
    }

    await session.commitTransaction();
    session.endSession();
console.log('remoced')
    res.json({ success: true });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: err.message });
  }
};

function makeKeyForUser(userId, fileName) {
  // e.g. users/{userId}/assets/{timestamp}-{sanitizedFilename}
  const stamp = Date.now();
  const safe = fileName.replace(/[^a-zA-Z0-9\.\-_]/g, "-");
  return `users/${userId}/assets/${stamp}-${safe}`;
}

export const getPresignedForAsset = async (req, res) => {
  try {
    const { fileName, contentType, folder, expectedSize } = req.body;
    console.log('getting presign for assets :', fileName, contentType, folder, expectedSize)
    if (!fileName || !contentType) {
      return res.status(400).json({ message: "fileName and contentType required" });
    }
    const key = makeKeyForUser(req.user.id, fileName);
    const result = await generatePresignedUpload({ key, contentType, expires: Number(process.env.PRESIGN_EXPIRES || 600) });
    console.log('presigned', result)
    return res.json({ key: result.key, url: result.url });
  } catch (err) {
    console.error("getPresignedForAsset:", err);
    res.status(500).json({ message: "Failed to generate presigned URL" });
  }
};
export const getAssets = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20", 10)));
    const rawCursor = req.query.cursor || null;
    const queryText = req.query.query?.trim() || "";
    const folderId = req.query.folderId || null;
    const mimeType = req.query.mimeType || null;
    const extension = req.query.extension || null;
    const isDocumented =
      typeof req.query.isDocumented !== "undefined"
        ? req.query.isDocumented === "true"
        : null;
    const storageStatus = req.query.storageStatus || null;
    const sortBy = req.query.sort || "createdAt"; // createdAt or size

    console.log(
      ownerId,
      limit,
      rawCursor,
      queryText,
      folderId,
      mimeType,
      extension,
      isDocumented,
      storageStatus,
      sortBy
    );

    // basic search condition - always filter by owner
    const baseCond = { owner: ownerId };
if (folderId) {
  if (!mongoose.isValidObjectId(folderId)) {
    return res.status(400).json({ message: "Invalid folderId" });
  }

  baseCond.folders = {
    $in: [new mongoose.Types.ObjectId(folderId)]
  };
}

    if (mimeType) baseCond.mimeType = mimeType;
    if (extension) baseCond.extension = extension;
    if (isDocumented !== null) baseCond.isDocumented = isDocumented;
    if (storageStatus) baseCond.storageStatus = storageStatus;

    // search by name
    let searchCondition = {};
    if (queryText) {
      const regex = { $regex: queryText, $options: "i" };
      searchCondition = {
        $or: [{ name: regex }, { originalFileName: regex }],
      };
    }

    // cursor parsing
    let cursorSize = null;
    let cursorId = null;

    if (
      sortBy === "size" &&
      rawCursor &&
      typeof rawCursor === "string" &&
      rawCursor.includes("|")
    ) {
      const parts = rawCursor.split("|");
      cursorSize = Number(parts[0]);
      cursorId = parts[1];

      if (!Number.isFinite(cursorSize)) cursorSize = null;
      if (!mongoose.isValidObjectId(cursorId)) cursorId = null;
    } else if (rawCursor && mongoose.isValidObjectId(rawCursor)) {
      cursorId = rawCursor;
    }

    // build cursor condition
    let cursorCondition = {};

    if (sortBy === "size") {
      if (cursorSize !== null && cursorId) {
        cursorCondition = {
          $or: [
            { size: { $lt: cursorSize } },
            {
              size: cursorSize,
              _id: { $lt: new mongoose.Types.ObjectId(cursorId) },
            },
          ],
        };
      }
    } else {
      // createdAt/_id cursor
      if (cursorId) {
        cursorCondition = {
          _id: { $lt: new mongoose.Types.ObjectId(cursorId) },
        };
      }
    }

    // final query
    const finalCond = {
      ...baseCond,
      ...searchCondition,
      ...cursorCondition,
    };

    const sortQuery =
      sortBy === "size" ? { size: -1, _id: -1 } : { _id: -1 };

    const fetchLimit = limit;

    const assets = await Asset.find(finalCond)
      .sort(sortQuery)
      .limit(fetchLimit)
      .select("-__v")
      .lean();

    const nextCursor = assets.length
      ? sortBy === "size"
        ? `${assets[assets.length - 1].size}|${assets[assets.length - 1]._id}`
        : assets[assets.length - 1]._id.toString()
      : null;

    const hasMore = assets.length === fetchLimit;

    const count = await Asset.countDocuments(baseCond);

    return res.json({
      success: true,
      results: assets,
      limit: fetchLimit,
      nextCursor,
      hasMore,
      count,
    });
  } catch (err) {
    console.error("getAssets err:", err);
    res.status(500).json({
      message: "Failed to get assets",
      error: err.message,
    });
  }
};

/**
 * GET /products/:productId/assets
 * Returns product.assets (snapshots) and optionally full Asset docs (populated)
 * Query param: populate=true to include full Asset documents (only allowed to product owner).
 */
export const getConnectedAssetsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid productId" });

    const product = await Product.findById(productId).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    // permission: product owner can see full asset info; others get snapshot only
    const isOwner = String(product.postedBy) === String(req.user.id);
    const populateFull = req.query.populate === "true" && isOwner;

    if (!product.assets || product.assets.length === 0) {
      return res.json({ success: true, results: [] });
    }

    if (populateFull) {
      // fetch assets in bulk
      const assetIds = product.assets.map(a => a.assetId).filter(id => mongoose.isValidObjectId(id));
      const assets = await Asset.find({ _id: { $in: assetIds } }).select("-__v").lean();

      // map by id for ordering
      const assetsMap = new Map(assets.map(a => [a._id.toString(), a]));
      const ordered = product.assets.map(a => ({
        snapshot: a.snapshot,
        asset: assetsMap.get(String(a.assetId)) || null
      }));

      return res.json({ success: true, results: ordered });
    } else {
      // just return snapshots
      return res.json({ success: true, results: product.assets.map(a => a.snapshot) });
    }
  } catch (err) {
    console.error("getConnectedAssetsByProduct err:", err);
    res.status(500).json({ message: "Failed to get connected assets", error: err.message });
  }
};

/**
 * POST /assets/folder/move
 * Body: { assetIds: [...], targetFolderId: <id|null> }
 * Moves multiple assets into target folder (or root if null).
 * Updates folder totalSize/assetCount for source & target.
 * Uses mongoose transaction (requires replica set).
 */
export const moveAssetsToFolders = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const ownerId = req.user.id;
    let { assetIds, folderIds } = req.body;

    if (!Array.isArray(assetIds) || !assetIds.length)
      return res.status(400).json({ message: "assetIds required" });

    folderIds = Array.isArray(folderIds)
      ? folderIds.filter(id => mongoose.isValidObjectId(id))
      : [];

    session.startTransaction();

    const assets = await Asset.find({
      _id: { $in: assetIds },
      owner: ownerId
    }).session(session);

    for (const asset of assets) {
      const oldFolders = asset.folders || [];
      const totalSize = asset.size || 0;

      // decrement old
      for (const oldId of oldFolders) {
        await AssetFolder.findByIdAndUpdate(oldId, {
          $inc: { assetCount: -1, totalSize: -totalSize }
        }).session(session);
      }

      // set new
      asset.folders = folderIds;
      await asset.save({ session });

      // increment new
      for (const newId of folderIds) {
        await AssetFolder.findByIdAndUpdate(newId, {
          $inc: { assetCount: 1, totalSize }
        }).session(session);
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: err.message });
  }
};


/**
 * POST /assets/folder/remove
 * Body: { assetIds: [...] }
 * Removes folder association (moves to root) for multiple assets.
 * This is a convenience wrapper around moveMultipleAssetsToFolder with targetFolderId = null
 */
export const removeMultipleAssetsFromFolder = async (req, res) => {
  req.body.targetFolderId = null;
  return moveMultipleAssetsToFolder(req, res);
};

// After client uploads to S3, it calls this endpoint to create Asset doc
export const createAssetRecord = async (req, res) => {
  try {
    const { key, name, originalFileName, size, mimeType, folderId } = req.body;
    console.log('creating assets record :', key, name, originalFileName, size, mimeType, folderId )
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
console.log('record creted', newAsset)

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
export const getFolders = async (req, res) => {
  try {
    const owner = req.user.id;

    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "20")));
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const skip = (page - 1) * limit;

    const query = { owner };

    const total = await AssetFolder.countDocuments(query);

    const folders = await AssetFolder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      folders,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (err) {
    console.error("getFolders err:", err);
    res.status(500).json({ message: "Failed to fetch folders" });
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

// controllers/folderController.js
import AssetFolder from "../models/folderOfAsset.js";
import Asset from "../models/asset.js";
import path from "path";
import mongoose from "mongoose";

function normalizeFolderPath(p) {
  // Ensure posix style and remove leading/trailing slashes
  const normalized = path.posix.normalize(p).replace(/^\/+|\/+$/g, "");
  if (normalized.includes("..")) throw new Error("Invalid path");
  return normalized;
}

/**
 * POST /api/asset-folders/bulk-create
 * body: { paths: string[] }  // e.g. ["summer", "summer/dogs"]
 * returns: { mapping: { "<path>": "<folderId>" } }
 */
export const bulkCreateFolders = async (req, res) => {
  const owner = req.user.id;
  const { paths } = req.body;
  if (!Array.isArray(paths)) return res.status(400).json({ message: "paths array required" });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // ensure unique, normalized and sorted by depth asc
    const normalizedPaths = Array.from(new Set(paths.map(normalizeFolderPath))).filter(Boolean);
    normalizedPaths.sort((a, b) => a.split("/").length - b.split("/").length);

    const pathToId = {}; // mapping to return
    // Cache to reduce DB lookups
    const cache = new Map(); // key: parentId||'root' + '::' + name => folder doc

    for (const fullPath of normalizedPaths) {
      const segments = fullPath.split("/");
      let parentId = null;

      // iterate segments, creating each level if missing
      let cumPath = "";
      for (const seg of segments) {
        cumPath = cumPath ? `${cumPath}/${seg}` : seg;
        const cacheKey = `${parentId || "root"}::${seg}`;

        if (cache.has(cacheKey)) {
          parentId = cache.get(cacheKey)._id;
          continue;
        }

        // check existing folder with same owner, same name, same parent
        let folder = await AssetFolder.findOne({ owner, name: seg, parentFolder: parentId }).session(session);
        if (!folder) {
          folder = await AssetFolder.create([{ owner, name: seg, parentFolder: parentId }], { session });
          folder = folder[0];
        }
        cache.set(cacheKey, folder);
        parentId = folder._id;
      }

      // for the fullPath, the folder id is parentId after loop
      pathToId[fullPath] = parentId;
    }

    await session.commitTransaction();
    session.endSession();
    return res.json({ mapping: pathToId });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("bulkCreateFolders err:", err);
    return res.status(500).json({ message: "Failed to create folders", error: err.message });
  }
};
export const attachAssetsToProduct = async (req, res) => {
  try {
    const { productId, assetIds } = req.body;

    const assets = await Asset.find({ _id: { $in: assetIds }, owner: req.user.id });

    const snapshots = assets.map(a => ({
      assetId: a._id,
      snapshot: {
        name: a.name,
        extension: a.extension,
        size: a.size,
        mimeType: a.mimeType,
        folderPath: a.folders?.map(f => f.name).join("/") || "",
      }
    }));

    // Update Product
    const product = await Product.findByIdAndUpdate(
      productId,
      { $addToSet: { assets: { $each: snapshots } } },
      { new: true }
    );

    // Update Assets documents array
    await Asset.updateMany(
      { _id: { $in: assetIds } },
      { $addToSet: { documents: { productId, productName: product.name, productMediaPreview: product.media[0], snapshotAt: new Date() } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Detach individual assets
export const detachAssetsFromProduct = async (req, res) => {
  try {
    const { productId, assetIds } = req.body;

    // Remove snapshots from product
    const product = await Product.findByIdAndUpdate(
      productId,
      { $pull: { assets: { assetId: { $in: assetIds } } } },
      { new: true }
    );

    // Remove product reference from asset documents
    await Asset.updateMany(
      { _id: { $in: assetIds } },
      { $pull: { documents: { productId } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Attach all assets in folder
export const attachFolderToProduct = async (req, res) => {
  try {
    const { productId, folderId } = req.body;
    const assets = await Asset.find({ folders: folderId, owner: req.user.id });

    const snapshots = assets.map(a => ({
      assetId: a._id,
      snapshot: {
        name: a.name,
        extension: a.extension,
        size: a.size,
        mimeType: a.mimeType,
        folderPath: a.folders?.map(f => f.name).join("/") || "",
      }
    }));

    const product = await Product.findByIdAndUpdate(
      productId,
      { $addToSet: { assets: { $each: snapshots } } },
      { new: true }
    );

    await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { $addToSet: { documents: { productId, productName: product.name, productMediaPreview: product.media[0], snapshotAt: new Date() } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Detach folder
export const detachFolderFromProduct = async (req, res) => {
  try {
    const { productId, folderId } = req.body;

    const assets = await Asset.find({ folders: folderId, owner: req.user.id });

    const product = await Product.findByIdAndUpdate(
      productId,
      { $pull: { assets: { assetId: { $in: assets.map(a => a._id) } } } },
      { new: true }
    );

    await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { $pull: { documents: { productId } } }
    );

    res.json({ success: true, product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get product assets
export const getProductAssets = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate("assets.assetId");
    res.json({ success: true, assets: product.assets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    console.log('creating folder with:', name, parentFolder)
    if (!name) return res.status(400).json({ message: "name required" });
    const folder = new AssetFolder({ owner: req.user.id, name, parentFolder: parentFolder || null });
    await folder.save();
    console.log('folder created')
    res.status(201).json({ folder });
  } catch (err) {
    console.error("createFolder err:", err);
    res.status(500).json({ message: "Failed to create folder" });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;
    console.log('renamding', folderId, name)
    const folder = await AssetFolder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (String(folder.owner) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });
    folder.name = name;
    console.log('folder updated successfully')
    await folder.save();
    res.json({ folder });
  } catch (err) {
    console.error("renameFolder err:", err);
    res.status(500).json({ message: "Failed to rename" });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const folder = await AssetFolder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (String(folder.owner) !== String(req.user.id)) return res.status(403).json({ message: "Forbidden" });

    // Option A: move assets to root (null) OR Option B: forbid delete if contains assets.
    const assetsCount = await Asset.countDocuments({ folder: folder._id });
    if (assetsCount > 0) {
      return res.status(400).json({ message: "Folder not empty. Move or delete assets first." });
    }

    await folder.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("deleteFolder err:", err);
    res.status(500).json({ message: "Failed to delete folder" });
  }
};

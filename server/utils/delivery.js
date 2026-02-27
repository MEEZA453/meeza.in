// helpers/delivery.js
import mongoose from "mongoose";
import Asset from '../models/asset.js';
import AssetFolder from "../models/folderOfAsset.js";
import User from "../models/user.js";
import Purchase from "../models/purchase.js";

import path from "path";
import { copyObject } from "../services/s3Client.js";

/**
 * Recursively collect descendant folder IDs (including the root)
 */
async function getDescendantFolderIds(rootFolderId) {
  const ids = [String(rootFolderId)];
  const queue = [String(rootFolderId)];

  while (queue.length) {
    const parent = queue.shift();
    const children = await AssetFolder.find({ parentFolder: parent }).select("_id").lean();
    for (const c of children) {
      const cid = String(c._id);
      ids.push(cid);
      queue.push(cid);
    }
  }
  return ids;
}

/**
 * Build path names from a folder up to root.
 * Returns array of folder names from root->...->folder
 */
async function getFolderPathNames(folderId) {
  const names = [];
  let current = await AssetFolder.findById(folderId).lean();
  while (current) {
    names.unshift(current.name);
    if (!current.parentFolder) break;
    current = await AssetFolder.findById(current.parentFolder).lean();
  }
  return names;
}

/**
 * Ensure a folder exists under buyer with the given path (array of folder names),
 * reusing existing buyer folders when possible. Returns the final folderId.
 * Uses session for transactional consistency.
 */
async function ensureBuyerFolderForPath(buyerId, pathParts, session, cache = new Map(), rootFolderId = null) {
  // cache key: buyerId + '|' + pathParts.join('/')
  const cacheKey = `${buyerId}|${pathParts.join("/")}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // If rootFolderId is provided, start from that folder; otherwise start from top-level (null)
  let parent = rootFolderId ? { _id: rootFolderId } : null;
  for (let i = 0; i < pathParts.length; i++) {
    const name = pathParts[i];
    const q = { owner: buyerId, name, parentFolder: parent ? parent._id : null };
    const found = await AssetFolder.findOne(q).session(session);
    if (found) {
      parent = found;
      continue;
    }
    const created = await AssetFolder.create([{
      owner: buyerId,
      name,
      parentFolder: parent ? parent._id : null,
      totalSize: 0,
      assetCount: 0
    }], { session });
    parent = created[0];
  }

  const finalId = parent ? parent._id : null;
  cache.set(cacheKey, finalId);
  return finalId;
}

/**
 * Core delivery: copies assets and creates buyer Asset documents.
 *
 * - productRootFolderId: the new buyer folder that is created for this purchase.
 * - product: the product document (with .assets entries)
 * - session: mongoose session
 */
async function printBuyerFileTree(buyerId, rootFolderId, session) {
  console.log("\n📁 ===== FINAL FILE TREE =====");

  async function printFolder(folderId, indent = "") {
    const folder = await AssetFolder.findById(folderId).session(session).lean();
    if (!folder) return;

    console.log(`${indent}📁 ${folder.name}/`);

    // print files inside this folder
    const assets = await Asset.find({ folders: folderId }).session(session).lean();
    for (const asset of assets) {
      console.log(`${indent}  📄 ${asset.name}`);
    }

    // find child folders
    const children = await AssetFolder.find({ parentFolder: folderId }).session(session).lean();

    for (const child of children) {
      await printFolder(child._id, indent + "  ");
    }
  }

  await printFolder(rootFolderId);

  console.log("📁 ==========================\n");
}
export async function deliverProductAssets(order, session) {
  // order.product is populated in your verify flow
  const buyerId = String(order.buyer._id);
  const product = order.product;
  console.log("Delivering product assets for order", order._id, "buyer", buyerId, "product", product._id);

  // If product already had no assets -> nothing to do
  if (!product.assets || product.assets.length === 0) return;

  // product root name (used to strip duplicated top-level name)
  const productRootName = String(product.name || "").trim();

  // create product folder in buyer root (if not exists)
  const productFolder = await AssetFolder.create([{
    owner: buyerId,
    name: product.name || `product-${product._id}`,
    parentFolder: null,
    totalSize: 0,
    assetCount: 0
  }], { session });
  const buyerProductFolder = productFolder[0];

  const createdAssets = [];
  const folderCache = new Map(); // avoid re-creating same folders
  const buyerFolderPathCache = new Map();

  // global set to avoid copying same source asset multiple times
  const processedAssetIds = new Set();

  console.log("Created buyer product folder", buyerProductFolder._id, "for product", product._id);

  // Precompute set of folder ids that are explicitly referenced by the product
  const productFolderIds = new Set(
    product.assets
      .filter(e => e.itemType === "AssetFolder")
      .map(e => String(e.itemId))
  );

  // Loop over product assets: handle single assets and folders
  for (const entry of product.assets) {
    if (entry.itemType === "Asset") {
      // simple asset copy (single asset referenced directly)
      const srcAsset = await Asset.findById(entry.itemId).session(session);
      if (!srcAsset) continue;

      const srcAssetIdStr = String(srcAsset._id);
      if (processedAssetIds.has(srcAssetIdStr)) {
        console.log("Skipping already processed asset (direct):", srcAssetIdStr);
        continue;
      }

      // compute deepest folder path for this asset (if belongs to folders)
      let relativeParts = [];
      if (srcAsset.folders && srcAsset.folders.length > 0) {
        let deepest = null;
        let maxDepth = -1;
        for (const f of srcAsset.folders) {
          try {
            const full = await getFolderPathNames(f);
            if (full.length > maxDepth) {
              maxDepth = full.length;
              deepest = { id: f, full };
            }
          } catch (e) {
            // ignore bad folder refs
          }
        }
        if (deepest) {
          // full path names for the folder that contains this asset
          const fullPathNames = deepest.full; // e.g. ['sexophone','team','sub']
          // remove product root name if present as leading folder so we don't create duplicate top-level
          if (fullPathNames.length > 0 && fullPathNames[0] === productRootName) {
            relativeParts = fullPathNames.slice(1); // e.g. ['team','sub']
          } else {
            relativeParts = fullPathNames; // e.g. ['team','sub'] if product root not part of names
          }
        }
      }

      // create folder chain under buyer product folder
      let destFolderId = buyerProductFolder._id;
      if (relativeParts && relativeParts.length > 0) {
        // pass buyerProductFolder._id so folders are created under the product folder
        const destFolderIdFromPath = await ensureBuyerFolderForPath(buyerId, relativeParts, session, folderCache, buyerProductFolder._id);
        if (destFolderIdFromPath) destFolderId = destFolderIdFromPath;
      }

      // prepare dest key and copy
      const srcKey = srcAsset.key;
      if (!srcKey) {
        console.warn("Skipping asset with missing srcKey:", srcAsset._id);
        continue;
      }

      const ext = srcAsset.extension || path.extname(srcKey).replace(".", "");
      const baseName = (srcAsset.name || srcAsset.originalFileName || "file").replace(/\.[^/.]+$/, "");
      const fileName = `${Date.now()}-${baseName}${ext ? "." + ext : ""}`;
      // use order._id in path for uniqueness (you may keep product._id if you prefer)
      const destKey = `users/${buyerId}/purchases/${product._id}/${fileName}`;

      console.log("COPY DEBUG (single asset):", { srcKey, destKey, assetId: srcAsset._id, name: srcAsset.name });

      await copyObject({
        sourceKey: srcKey,
        destKey: destKey
      });

      // create buyer asset
      const buyerAsset = await Asset.create([{
        owner: buyerId,
        name: srcAsset.name,
        originalFileName: srcAsset.originalFileName,
        key: destKey,
        size: srcAsset.size,
        mimeType: srcAsset.mimeType,
        extension: srcAsset.extension,
        folders: [destFolderId],
        isDocumented: false,
        isMyAsset: false,
        storageStatus: "published"
      }], { session });

      console.log("Created buyer asset", buyerAsset[0]._id, "for source asset", srcAsset._id);

      // update counters
      await AssetFolder.findByIdAndUpdate(destFolderId, { $inc: { totalSize: srcAsset.size, assetCount: 1 } }).session(session);
      await User.findByIdAndUpdate(buyerId, { $inc: { storageUsed: srcAsset.size } }).session(session);

      createdAssets.push({
        assetId: buyerAsset[0]._id,
        name: buyerAsset[0].name,
        size: buyerAsset[0].size,
        extension: buyerAsset[0].extension,
        key: destKey
      });

      processedAssetIds.add(srcAssetIdStr);

    } else if (entry.itemType === "AssetFolder") {
      // For folders: gather descendant folders and all assets inside those folders
      const srcFolderId = entry.itemId;
      const descendantFolderIds = await getDescendantFolderIds(srcFolderId);

      // find all assets that belong to ANY of those folders (could be in multiple folders)
      const assetsInFolder = await Asset.find({ folders: { $in: descendantFolderIds.map(id => new mongoose.Types.ObjectId(id)) } }).session(session);
      console.log("Found assets in descendant folders:", assetsInFolder.map(a => a.name));

      // Precompute srcRootPath once for this srcFolderId
      const srcRootPath = await getFolderPathNames(srcFolderId);

      // For each asset, compute relative path from the srcFolder root and recreate under buyer product folder
      for (const srcAsset of assetsInFolder) {
        const srcAssetIdStr = String(srcAsset._id);
        if (processedAssetIds.has(srcAssetIdStr)) {
          // already delivered by a previous step (either direct asset or other folder)
          continue;
        }        // Choose the best folder reference among the asset's folders:
        // prefer the candidate that yields the longest relative path from the src root
        let bestRelativeParts = null;
        let bestLen = -1;
        for (const f of srcAsset.folders || []) {
          const fid = String(f);
          if (!descendantFolderIds.includes(fid)) continue; // not in this subtree

          const fullPath = await getFolderPathNames(fid); // e.g. ['Gear5','team','sub']
          const relative = fullPath.slice(srcRootPath.length); // relative to srcFolder root

          if (relative.length > bestLen) {
            bestLen = relative.length;
            bestRelativeParts = relative;
          }
        }

        // fallback: if we didn't find any folder (edge-case), leave as empty array
        let relativeParts = bestRelativeParts || [];

        // If relativeParts is empty, we may still want to place the file in the srcFolder itself
        // (i.e. asset is directly inside the srcFolder root). Detect that and use srcFolder's name
        // so we recreate the srcFolder under the buyer product folder.
        if (relativeParts.length === 0) {
          // Case A: asset references the srcFolder directly -> create a dest folder named as srcFolder
          const assetHasSrcFolder = (srcAsset.folders || []).some(f => String(f) === String(srcFolderId));
          if (assetHasSrcFolder) {
            const srcFolderDoc = await AssetFolder.findById(srcFolderId).session(session).lean();
            if (srcFolderDoc) {
              // avoid duplicating product root: if srcFolderDoc.name === productRootName, skip
              if (srcFolderDoc.name !== productRootName) {
                relativeParts = [srcFolderDoc.name];
              } else {
                // if the src folder name equals product root, keep files at product root
                relativeParts = [];
              }
            }
          } else {
            // Case B: asset belongs to a deeper descendant but our path resolution returned empty
            // (possible due to path shapes). Try to use a non-root descendant folder's name as a fallback.
            const nonRootFolder = (srcAsset.folders || []).find(f => String(f) !== String(srcFolderId) && descendantFolderIds.includes(String(f)));
            if (nonRootFolder) {
              const folderDoc = await AssetFolder.findById(nonRootFolder).session(session).lean();
              if (folderDoc) relativeParts = [folderDoc.name];
            }
          }
        }

        // As a final normalization: if relativeParts starts with productRootName (duplicate top-level), remove it if relativeParts starts with productRootName (duplicate top-level), remove it
        if (relativeParts.length > 0 && relativeParts[0] === productRootName) {
          relativeParts = relativeParts.slice(1);
        }

        console.log("Asset", srcAsset.name, "relative path parts from folder root:", relativeParts);

        // create matching folders under buyer product folder
        let destFolderId = buyerProductFolder._id;
        if (relativeParts && relativeParts.length > 0) {
          const destFolderIdFromPath = await ensureBuyerFolderForPath(
            buyerId,
            relativeParts,
            session,
            folderCache,
            buyerProductFolder._id // 👈 IMPORTANT
          );
          if (destFolderIdFromPath) destFolderId = destFolderIdFromPath;
        }

        // copy object
        const srcKey = srcAsset.key;
        if (!srcKey) {
          console.warn("Skipping asset with missing srcKey (folder case):", srcAsset._id);
          processedAssetIds.add(srcAssetIdStr);
          continue;
        }

        const ext = srcAsset.extension || path.extname(srcKey).replace(".", "");
        const baseName = (srcAsset.name || srcAsset.originalFileName || "file").replace(/\.[^/.]+$/, "");
        const fileName = `${Date.now()}-${baseName}${ext ? "." + ext : ""}`;
        const destKey = `users/${buyerId}/purchases/${product._id}/${fileName}`;

        console.log("COPY DEBUG (folder asset):", {
          srcKey,
          destKey,
          assetId: srcAsset._id,
          name: srcAsset.name
        });

        await copyObject({
          sourceKey: srcKey,
          destKey: destKey
        });

        // create buyer asset
        const buyerAsset = await Asset.create([{
          owner: buyerId,
          name: srcAsset.name,
          originalFileName: srcAsset.originalFileName,
          key: destKey,
          size: srcAsset.size,
          mimeType: srcAsset.mimeType,
          extension: srcAsset.extension,
          folders: [destFolderId],
          isDocumented: false,
          isMyAsset: false,
          storageStatus: "published"
        }], { session });

        console.log("Created buyer asset", buyerAsset[0]._id, "for source asset", srcAsset._id);
        // update counts
        await AssetFolder.findByIdAndUpdate(destFolderId, { $inc: { totalSize: srcAsset.size, assetCount: 1 } }).session(session);
        await User.findByIdAndUpdate(buyerId, { $inc: { storageUsed: srcAsset.size } }).session(session);

        createdAssets.push({
          assetId: buyerAsset[0]._id,
          name: buyerAsset[0].name,
          size: buyerAsset[0].size,
          extension: buyerAsset[0].extension,
          key: destKey
        });

        processedAssetIds.add(srcAssetIdStr);
      }
    }
  }
  await printBuyerFileTree(buyerId, buyerProductFolder._id, session);
  // Create Purchase record (you already create one; adapt as needed)
  await Purchase.create([{
    buyer: buyerId,
    product: product._id,
    deliveredAssets: createdAssets,
    totalAmount: order.amount
  }], { session });

  return createdAssets;
}

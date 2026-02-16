// routes/assets.js
import express from "express";
import {checkStorageLimit, verifyToken} from '../middleweres/auth.js'
import {
  getPresignedForAsset,
  createAssetRecord,
  renameAsset,
  deleteAsset,
  // moveMultipleAssetsToFolder,
  removeMultipleAssetsFromFolder,
  getConnectedAssetsByProduct,
  getAssets,
  getFolders,
  addAssetsToFolders,
  removeAssetsFromFolders,
  moveAssetsToFolders
} from "../controller/asset.js";
import {
  createFolder,
  renameFolder,
  deleteFolder
} from "../controller/folderOfAsset.js";

const router = express.Router();

router.use(verifyToken);

router.post("/presign", checkStorageLimit, getPresignedForAsset); // body: fileName, contentType, expectedSize
router.post("/create", createAssetRecord); // body: key, name, originalFileName, size, mimeType, folderId
router.put("/rename/:assetId", renameAsset);
router.delete("/delete/:assetId", deleteAsset);
router.get("/", getAssets);

// move multiple assets to folder (or root)
router.post("/folder/add", addAssetsToFolders);
router.post("/folder/remove", removeAssetsFromFolders);
router.post("/folder/move", moveAssetsToFolders);

// remove multiple assets from folder (move to root)
router.post("/folder/remove", removeMultipleAssetsFromFolder);
router.get("/folders", getFolders);

// get connected assets by product id (snapshots or full docs with populate=true for owner)
router.get("/product/:productId", getConnectedAssetsByProduct);

// folders
router.post("/folder/create", createFolder);
router.put("/folder/rename/:folderId", renameFolder);
router.delete("/folder/:folderId", deleteFolder);

export default router;

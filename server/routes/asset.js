// routes/assets.js
import express from "express";
import {checkStorageLimit, verifyToken} from '../middleweres/auth.js'
import {
  getPresignedForAsset,
  createAssetRecord,
  renameAsset,
  deleteAsset
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

// folders
router.post("/folder/create", createFolder);
router.put("/folder/rename/:folderId", renameFolder);
router.delete("/folder/:folderId", deleteFolder);

export default router;

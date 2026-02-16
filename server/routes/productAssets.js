// routes/productAssets.js
import express from "express";
import { verifyToken } from "../middleweres/auth.js";
import {
  attachAssetsToProduct,
  detachAssetsFromProduct,
  attachFolderToProduct,
  detachFolderFromProduct,
  getProductAssets
} from "../controller/productAssets.js";

const router = express.Router();
router.use(verifyToken);

// Attach/detach individual assets
router.post("/attach", attachAssetsToProduct); // body: productId, assetIds
router.post("/detach", detachAssetsFromProduct); // body: productId, assetIds

// Attach/detach folder of assets
router.post("/folder/attach", attachFolderToProduct); // body: productId, folderId
router.post("/folder/detach", detachFolderFromProduct); // body: productId, folderId

// Get attached assets of a product
router.get("/:productId", getProductAssets);

export default router;

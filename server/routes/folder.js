import express from "express";
import { verifyToken } from "../middleweres/auth.js";
import {
  createFolder,
  getMyFolders,
  getAllFolders,
  addProductToFolder,
  removeProductFromFolder,
  deleteFolder,
  renameFolder,
  copyProductToFolder,
  moveProductToFolder,
  getFolderById,
} from "../controller/folder.js";

const router = express.Router();

// Create folder
router.post("/create", verifyToken, createFolder);
router.get("/folder/:id", getFolderById);
// Get folders
router.get("/my-folders", verifyToken, getMyFolders); // only user's folders
router.get("/all-folders", getAllFolders); // all folders (no auth required, or can add verifyToken if needed)

// Add / remove / rename / delete / copy / move
router.put("/add-product", verifyToken, addProductToFolder);
router.put("/remove-product", verifyToken, removeProductFromFolder);
router.put("/rename/:id", verifyToken, renameFolder);
router.delete("/delete/:id", verifyToken, deleteFolder);
router.put("/copy-product", verifyToken, copyProductToFolder);
router.put("/move-product", verifyToken, moveProductToFolder);

export default router;

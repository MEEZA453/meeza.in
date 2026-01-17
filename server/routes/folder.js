// routes/folder.js
import express from "express";
import { verifyToken } from "../middleweres/auth.js";
import {
  createFolder,
  getFoldersByItemId,
  editFolder,
  deleteFolder,
  getAllFolders,
  getFolderById,
  getItemsByFolderId,
  getProductsByFolderId,
  getPostsByFolderId,
  removeMultipleProductsFromFolder,
  removeProductFromFolder,
  removeMultiplePostsFromFolder,
  removePostFromFolder,
  addProductToFolder,
  addMultipleProductsToFolder,
  addPostToFolder,
  addMultiplePostsToFolder,
  getMyFolders,
} from "../controller/folder.js"; // change path if your controller file is renamed
import { upload } from "../config/cloudinery.js";

const router = express.Router();

/*
  Public / listing routes
  - GET /all                     -> getAllFolders
  - GET /by-item/:itemId?type=.. -> getFoldersByItemId (type=post|product)
*/
router.get("/all", getAllFolders);
router.get("/by-item/:itemId", getFoldersByItemId);

/*
  Folder detail & items (these use verifyToken like your previous routes;
  controller reads req.user?.id so verifyToken helps identify the caller)
  - GET /:id                      -> getFolderById
  - GET /:id/items?type=..        -> getItemsByFolderId (type=product|post)
  - GET /:id/products             -> getProductsByFolderId
  - GET /:id/posts                -> getPostsByFolderId
*/
router.get("/folderById/:id", verifyToken, getFolderById);
router.get("/:id/items", verifyToken, getItemsByFolderId);
router.get("/:id/products", verifyToken, getProductsByFolderId);
router.get("/:id/posts", verifyToken, getPostsByFolderId);
router.get("/my-folders", verifyToken, getMyFolders);
/*
  Create / edit / delete
  - POST /create       (multipart, profile) -> createFolder
  - PUT  /edit/:id     (multipart, profile) -> editFolder
  - DELETE /delete/:id                      -> deleteFolder
*/
router.post("/create", verifyToken, upload.single("profile"), createFolder);
router.put("/edit/:id", verifyToken, upload.single("profile"), editFolder);
router.delete("/delete/:id", verifyToken, deleteFolder);

/*
  Product operations
  - PUT  /add-product             body: { folderId, productId }
  - POST /add-multiple-products  body: { folderId, productIds: [] }
  - PUT  /remove-product          body: { folderId, productId }
  - PUT  /remove-multiple-products body: { folderId, productIds: [] }
*/
router.put("/add-product", verifyToken, addProductToFolder);
router.post("/add-multiple-products", verifyToken, addMultipleProductsToFolder);
router.put("/remove-product", verifyToken, removeProductFromFolder);
router.put("/remove-multiple-products", verifyToken, removeMultipleProductsFromFolder);

/*
  Post operations (same patterns)
  - PUT  /add-post
  - POST /add-multiple-posts
  - PUT  /remove-post
  - PUT  /remove-multiple-posts
  bodies analogous to product endpoints (folderId, postId/postIds)
*/
router.put("/add-post", verifyToken, addPostToFolder);
router.post("/add-multiple-posts", verifyToken, addMultiplePostsToFolder);
router.put("/remove-post", verifyToken, removePostFromFolder);
router.put("/remove-multiple-posts", verifyToken, removeMultiplePostsFromFolder);

export default router;

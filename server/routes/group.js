// routes/group.js
import express from "express";
import { verifyToken } from "../middleweres/auth.js";
import {
  createGroup,
  editGroup,
  deleteGroup,
  getAllGroups,
  getGroupById,
  getProductsByGroupId,
  getContributorsByGroupId,
  sendContributionRequest,
  acceptContribution,
  rejectContribution,
  makeAdmin,
  removeAdmin,
  removeProductFromGroup,
  addProductToGroupDirect,
  listContributionRequests,
  getGroupsByProductId,
  removeMultipleProductsFromGroup,
  addMultipleProductsToGroup,
  updateGroupSubscription,
} from "../controller/group.js";
import { upload } from "../config/cloudinery.js";

const router = express.Router();

// public
router.get("/all", getAllGroups);
router.get("/:id",verifyToken,  getGroupById);
router.get("/by-product/:productId", getGroupsByProductId);

// group products & contributors
router.get("/:id/products", getProductsByGroupId); // ?page=1&limit=10
router.get("/:id/contributors", getContributorsByGroupId);

// auth required
router.post("/create", verifyToken, upload.single("profile"), createGroup);
router.put("/edit/:id", verifyToken,upload.single("profile"), editGroup);
router.delete("/delete/:id", verifyToken,upload.single("profile"), deleteGroup);

// contribution flow
router.post("/contribute", verifyToken, sendContributionRequest); // body: groupId, productId, message
router.get("/requests/:groupId", verifyToken, listContributionRequests); // admin only
router.post("/requests/accept/:requestId", verifyToken, acceptContribution); // admin/owner
router.post("/requests/reject/:requestId", verifyToken, rejectContribution); // admin/owner

// admin management (owner only)
router.post("/make-admin/:groupId", verifyToken, makeAdmin); // body: userIdToMakeAdmin
router.post("/remove-admin/:groupId", verifyToken, removeAdmin); // body: userIdToRemove

// product operations
router.post("/add-multiple-products", verifyToken, addMultipleProductsToGroup);
router.post("/subscription", verifyToken, updateGroupSubscription);
router.put("/add-product", verifyToken, addProductToGroupDirect); // body: groupId, productId (admin/owner)
router.put("/remove-product", verifyToken, removeProductFromGroup); // body: groupId, productId
router.put("/remove-multiple-products", verifyToken, removeMultipleProductsFromGroup); // body: groupId, productId


export default router;

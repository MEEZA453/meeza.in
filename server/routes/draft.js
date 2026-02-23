// routes/draftRoutes.js
import express from "express";
import {
  createPostDraft, updatePostDraft, listPostDrafts, getPostDraft, deletePostDraft, publishPostDraft,
  createProductDraft, updateProductDraft, listProductDrafts, getProductDraft, deleteProductDraft, publishProductDraft
} from "../controller/draft.js";
import { verifyToken } from "../middleweres/auth.js"; // adapt to your auth middleware

const router = express.Router();
router.use(verifyToken);
// Posts drafts
router.post("/posts/draft", createPostDraft);
router.patch("/posts/draft/:id", updatePostDraft);
router.get("/posts/drafts", listPostDrafts);
router.get("/posts/draft/:id", getPostDraft);
router.delete("/posts/draft/:id", deletePostDraft);
router.post("/posts/draft/:id/publish", publishPostDraft);

// Products drafts
router.post("/products/draft", createProductDraft);
router.patch("/products/draft/:id", updateProductDraft);
router.get("/products/drafts", listProductDrafts);
router.get("/products/draft/:id", getProductDraft);
router.delete("/products/draft/:id", deleteProductDraft);
router.post("/products/draft/:id/publish", publishProductDraft);

export default router;
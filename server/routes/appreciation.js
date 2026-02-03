// routes/appreciation.js
import express from "express";
import { verifyToken, verifyIsUser } from "../middleweres/auth.js";
import {
  appreciate,
  removeAppreciation,
  getAppreciationsByHandle,
  getAppreciatedPostsByHandle,
  getAppreciatedProductsByHandle,
  getPostAppreciations,
} from "../controller/appreciation.js";

const router = express.Router();

router.post("/appreciate", verifyToken, appreciate);
router.post("/appreciate/remove", verifyToken, removeAppreciation);

// mixed results (posts + products)
router.get("/byHandle/:handle", verifyIsUser, getAppreciationsByHandle);

// only posts / only products
router.get("/posts/byHandle/:handle", verifyIsUser, getAppreciatedPostsByHandle);
router.get("/products/byHandle/:handle", verifyIsUser, getAppreciatedProductsByHandle);

// get users who appreciated a post
router.get("/post/:postId/appreciations", getPostAppreciations);

export default router;

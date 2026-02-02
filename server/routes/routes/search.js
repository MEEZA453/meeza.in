import express from "express";
import {
  searchEverything,
  getSearchDefaults,
  deleteRecentKeyword,
  deleteRecentVisitedUser,
  // deleteRecentVisitedGroup,
  saveRecentKeyword
} from "../controller/search.js";

import { verifyToken } from "../middleweres/auth.js";

const router = express.Router();

router.get("/default", verifyToken, getSearchDefaults);
router.get("/", verifyToken, searchEverything);

// NEW DELETE ROUTES
router.post("/delete-keyword", verifyToken, deleteRecentKeyword);
router.post("/delete-visited-user", verifyToken, deleteRecentVisitedUser);
router.post("/save", verifyToken, saveRecentKeyword);
// router.post("/delete-visited-group", verifyToken, deleteRecentVisitedGroup);

export default router;

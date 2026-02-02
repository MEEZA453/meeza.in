import express from "express";
import {
  registerUser,
  loginUser,
  getProductsByUser,
  setHandle,
  updateUserProfile,
  getUserByHandle,

verifyOtp,
  sendOtp,
  searchUsers,
  getDefaultUsers,
  applyJury,
  approveJury,
  approveNormal,
  applyNormal
} from "../controller/user.js";

import { googleLogin } from "../controller/googleLogin.js";
import { verifyToken } from '../middleweres/auth.js';
import { upload } from "../config/cloudinery.js";
import { followUser, getFollowers, getFollowing, unfollowUser } from "../controller/follow.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);
router.get('/getProductById/:handle', getProductsByUser);
router.post("/applyJury", verifyToken, applyJury);
router.post("/applyNormal", verifyToken, applyNormal);


// Dev approves or rejects
router.post("/approveJury", verifyToken, approveJury);
router.post("/approveNormal", verifyToken, approveNormal);
// Login existing user
router.post("/login", loginUser);
router.post("/google-login", googleLogin);

// Set user handle
router.post("/handle", setHandle);

// OTP routes
router.post("/send-otp", sendOtp);  // send OTP to email
router.post("/verify-otp", verifyOtp);  // verify OTP

// Get user by handle

// Update user profile
router.put('/:id/profile', verifyToken, upload.single('image'), updateUserProfile);

router.post("/follow/:id", verifyToken, followUser);
router.post("/unfollow/:id", verifyToken, unfollowUser);

// Public followers/following list by handle
router.get("/:handle/followers",verifyToken, getFollowers);
router.get("/:handle/following",verifyToken, getFollowing);
router.get("/search/users", verifyToken, searchUsers);
router.get("/defaultSearch", getDefaultUsers);
router.get("/:handle", verifyToken, getUserByHandle);

export default router;

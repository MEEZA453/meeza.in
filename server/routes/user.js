import express from "express";
import { registerUser, loginUser , getProductsByUser , setHandle , updateUserProfile, getUserByHandle} from "../controller/user.js";
import { googleLogin } from "../controller/googleLogin.js";
import { verifyToken } from '../middleweres/auth.js';
import { upload } from "../config/cloudinery.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);
router.get('/getProductById/:handle', getProductsByUser);

// Login existing user
router.post("/login", loginUser);
router.post ("/google-login" , googleLogin)
router.post("/handle", setHandle);
router.get("/:handle", getUserByHandle);

router.put('/:id/profile', verifyToken, upload.single('image'), updateUserProfile);
export default router;

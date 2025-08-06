import express from "express";
import { registerUser, loginUser , getProductsByUser} from "../controller/user.js";
import { googleLogin } from "../controller/googleLogin.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);
router.get('/getProductById/:id', getProductsByUser);

// Login existing user
router.post("/login", loginUser);
router.post ("/google-login" , googleLogin)
export default router;

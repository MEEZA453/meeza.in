import express from "express";
import { registerUser, loginUser , getProductsByUser} from "../controller/user.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);
router.get('/getProductById/:id', getProductsByUser);

// Login existing user
router.post("/login", loginUser);

export default router;

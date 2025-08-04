import express from "express";
import { registerUser, loginUser } from "../controller/user.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Login existing user
router.post("/login", loginUser);

export default router;

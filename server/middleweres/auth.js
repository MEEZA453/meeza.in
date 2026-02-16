// middleware/auth.js

import jwt from "jsonwebtoken";
import User from "../models/user.js"; // your user model

export const verifyToken = async (req, res, next) => {

const token = req.cookies.token;
  if (!token) {
    console.log('token not found')
    return res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
  }else{
    console.log('token accepted')
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // { id, iat, exp }

    // Fetch the user from DB
    const user = await User.findById(decoded.id).select("id email name role"); // include any fields you want
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user; // now req.user has id, email, name
    next();
  } catch (err) {
    console.log("failed authentication", err);
    res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export const verifyIsUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // use same secret as in `verifyToken`
      req.user = decoded;
    } catch (err) {
      req.user = null; // Token invalid
    }
  } else {
    req.user = null; // No token provided
  }

  next();
};
export const verifyIsDev = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (req.user.role !== "dev") return res.status(403).json({ success: false, message: "Forbidden: devs only" });
  next();
};
export  async function checkStorageLimit(req, res, next) {
  try {
    // expectedSize (bytes) provided by client when requesting presigned upload
    const expectedSize = Number(req.body.expectedSize || req.query.expectedSize || 0);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const newUsage = user.storageUsed + expectedSize;
    if (user.storageLimit && newUsage > user.storageLimit) {
      return res.status(400).json({ message: "Storage limit exceeded" });
    }
    // attach user to req for later use
    req.currentUser = user;
    next();
  } catch (err) {
    console.error("checkStorageLimit error:", err);
    next(err);
  }
}
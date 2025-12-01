// middleware/auth.js

import jwt from "jsonwebtoken";
import User from "../models/user.js"; // your user model

export const verifyToken = async (req, res, next) => {

  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
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

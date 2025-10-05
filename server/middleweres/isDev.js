import User from "../models/user.js";

export const verifyDev = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "dev") {
      return res.status(403).json({ success: false, message: "Access denied. Developer only." });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
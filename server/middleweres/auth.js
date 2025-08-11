// middleware/auth.js
import jwt from "jsonwebtoken";

export const     verifyToken = (req, res, next) => {
    console.log('reached to authentication')
    const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
console.log('token is',token)
    if (!token) {
        return res.status(401).json({ success: false, message: "Access Denied: No Token Provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Add JWT_SECRET in your .env
        req.user = decoded; // Store user info in request
        next();
    } catch (err) {
        console.log('faliled authentication' , err)
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

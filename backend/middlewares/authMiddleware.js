const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

// 🛡 Protect Routes: Verify Token & Attach User to Request
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database using `license` (typo fixed from `lisence`)
      req.user = await User.findOne({ license: decoded.license }).select("-password");

      if (!req.user) {
        return res.status(401).json({ error: "User not found" });
      }

      next();
    } catch (error) {
      console.error("Not authorized, token failed", error);
      res.status(401).json({ error: "Not authorized, invalid token" });
    }
  } else {
    res.status(401).json({ error: "Not authorized, no token" });
  }
};

// 🛡 Admin Middleware: Restrict Access to Admins Only
const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes("Admin")) {
    return res.status(403).json({ error: "Access denied - Admins only" });
  }
  next();
};

module.exports = { protect, verifyAdmin };

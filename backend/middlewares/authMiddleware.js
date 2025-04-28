const jwt = require("jsonwebtoken")
const User = require("../models/UserModel")

// Protect Routes: Verify Token & Attach User to Request (Optimized)
const protect = async (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authorized, no token" })
    }

    // Extract token
    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from database - only select necessary fields
    const user = await User.findOne({ license: decoded.license }).select("-password").lean() // Use lean() for better performance

    if (!user) {
      return res.status(401).json({ error: "User not found" })
    }

    // Attach user to request
    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)

    // Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" })
    }

    res.status(401).json({ error: "Not authorized" })
  }
}

// Admin Middleware (Optimized)
const verifyAdmin = (req, res, next) => {
  if (!req.user || !req.user.roles.includes("Admin")) {
    return res.status(403).json({ error: "Access denied - Admins only" })
  }
  next()
}

module.exports = { protect, verifyAdmin }

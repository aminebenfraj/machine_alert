const express = require("express")
const { registerUser, loginUser, currentUser, logoutUser } = require("../controllers/authController")
const { protect } = require("../middlewares/authMiddleware")

const router = express.Router()

// Register a new user
router.post("/register", registerUser)

// Login user and return JWT token
router.post("/login", loginUser)

// Get current user info (Protected route)
router.get("/current-user", protect, currentUser)

// Logout user (new route)
router.post("/logout", logoutUser)

module.exports = router

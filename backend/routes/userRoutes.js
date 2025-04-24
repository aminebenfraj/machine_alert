const express = require("express")
const router = express.Router()
const {
  showUserInfo,
  updateUserRoles,
  updateCurrentUser,
  deleteUser,
  deleteCurrentUser,
  getCustomerById,
  getAllCustomers,
  getRecentUsers,
} = require("../controllers/userController")

const { protect, verifyAdmin } = require("../middlewares/authMiddleware")

// Get all customers (Admin only)
router.get("/customers", protect, verifyAdmin, getAllCustomers)

// Get customer by ID (Admin only)
router.get("/customer/:id", protect, verifyAdmin, getCustomerById)

// Get current user profile (Protected)
router.get("/profile", protect, showUserInfo)

// Update current user profile (Protected)
router.put("/update-profile", protect, updateCurrentUser)

// Update user roles (Admin only)
router.put("/role/:license", protect, verifyAdmin, updateUserRoles)

// Delete current user account (Protected)
router.delete("/delete", protect, deleteCurrentUser)

// Delete a user (Admin only)
router.delete("/:license", protect, verifyAdmin, deleteUser)

// Get recent users
router.get("/recent", protect, getRecentUsers)

module.exports = router

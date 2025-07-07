const express = require("express")
const router = express.Router()
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController")
const { protect } = require("../middlewares/authMiddleware")

// Create a new category - only Admin or PRODUCCION roles
router.post("/", protect, createCategory)

// Get all categories - authenticated users
router.get("/", protect, getAllCategories)

// Get a category by ID - authenticated users
router.get("/:id", protect, getCategoryById)

// Update a category - only Admin or PRODUCCION roles
router.put("/:id", protect, updateCategory)

// Delete a category - only Admin or PRODUCCION roles
router.delete("/:id", protect, deleteCategory)

module.exports = router

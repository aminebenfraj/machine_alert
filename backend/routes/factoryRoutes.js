const express = require("express")
const router = express.Router()
const {
  createFactory,
  getAllFactories,
  getFactoryById,
  updateFactory,
  deleteFactory,
  getFactoriesByCategory,
} = require("../controllers/factoryController")
const { protect } = require("../middlewares/authMiddleware")


// Create a new factory - only Admin or PRODUCCION roles
router.post("/", protect, createFactory)

// Get all factories - authenticated users (with optional category filter)
router.get("/", protect, getAllFactories)

// Get factories by category - authenticated users
router.get("/category/:categoryId", protect, getFactoriesByCategory)

// Get a factory by ID - authenticated users
router.get("/:id", protect, getFactoryById)

// Update a factory - only Admin or PRODUCCION roles
router.put("/:id", protect, updateFactory)

// Delete a factory - only Admin or PRODUCCION roles
router.delete("/:id", protect, deleteFactory)

module.exports = router

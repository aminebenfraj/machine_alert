const express = require("express")
const router = express.Router()
const {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  getMachinesByFactory,
  getMachinesByCategory,
} = require("../../controllers/gestionStockControllers/machineController")
const { protect } = require("../../middlewares/authMiddleware")
const { hasRole } = require("../../middlewares/roleMiddleware")

// Define the allowed roles for machine CRUD operations
const MACHINE_CRUD_ROLES = ["Admin", "PRODUCCION"]

// Create a new machine - only Admin or PRODUCCION roles
router.post("/", protect, hasRole(MACHINE_CRUD_ROLES), createMachine)

// Get all machines - authenticated users (with optional factory/category filter)
router.get("/", protect, getAllMachines)

// Get machines by factory - authenticated users
router.get("/factory/:factoryId", protect, getMachinesByFactory)

// Get machines by category - authenticated users
router.get("/category/:categoryId", protect, getMachinesByCategory)

// Get a machine by ID - authenticated users
router.get("/:id", protect, getMachineById)

// Update a machine - only Admin or PRODUCCION roles
router.put("/:id", protect, hasRole(MACHINE_CRUD_ROLES), updateMachine)

// Delete a machine - only Admin or PRODUCCION roles
router.delete("/:id", protect, hasRole(MACHINE_CRUD_ROLES), deleteMachine)

module.exports = router

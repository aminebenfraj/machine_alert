const express = require("express")
const router = express.Router()
const {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
} = require("../../controllers/gestionStockControllers/machineController")
const { protect, verifyAdmin } = require("../../middlewares/authMiddleware")

// Create a new machine - admin only
router.post("/", protect, verifyAdmin, createMachine)

// Get all machines - authenticated users
router.get("/", protect, getAllMachines)

// Get a machine by ID - authenticated users
router.get("/:id", protect, getMachineById)

// Update a machine - admin only
router.put("/:id", protect, verifyAdmin, updateMachine)

// Delete a machine - admin only
router.delete("/:id", protect, verifyAdmin, deleteMachine)

module.exports = router

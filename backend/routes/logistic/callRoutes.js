const express = require("express")
const {
  getCalls,
  createCall,
  completeCall,
  exportCalls,
  checkExpiredCalls,
  deleteCall,
} = require("../../controllers/logistic/callController")
const { protect } = require("../../middlewares/authMiddleware")
const router = express.Router()

// Get all calls - protected
router.get("/", protect, getCalls)

// Create a new call - protected
router.post("/", protect, createCall)

// Mark a call as completed - protected
router.put("/:id/complete", protect, completeCall)

// Manually check and update expired calls - protected
router.post("/check-expired", protect, checkExpiredCalls)

// Delete a call - protected
router.delete("/:id", protect, deleteCall)
router.get("/export", exportCalls)


module.exports = router

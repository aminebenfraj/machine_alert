const express = require('express');
const router = express.Router();
const {
  createMachine,
  getAllMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
} = require('../../controllers/gestionStockControllers/machineController');

// Create a new machine
router.post('/', createMachine);

// Get all machines
router.get('/', getAllMachines);

// Get a machine by ID
router.get('/:id', getMachineById);

// Update a machine
router.put('/:id', updateMachine);

// Delete a machine
router.delete('/:id', deleteMachine);

module.exports = router;

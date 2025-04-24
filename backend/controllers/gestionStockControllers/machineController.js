const Machine = require('../../models/gestionStockModels/MachineModel');

// Create a new machine
exports.createMachine = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Check if the machine already exists
    const existingMachine = await Machine.findOne({ name });
    if (existingMachine) {
      return res.status(400).json({ message: 'Machine with this name already exists.' });
    }

    const machine = new Machine({ name, description, status });
    await machine.save();
    res.status(201).json(machine);
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating machine.', error });
  }
};

// Get all machines
exports.getAllMachines = async (req, res) => {
  try {
    const machines = await Machine.find();
    res.status(200).json(machines);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching machines.', error });
  }
};

// Get a single machine by ID
exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found.' });
    }
    res.status(200).json(machine);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching machine.', error });
  }
};

// Update a machine
exports.updateMachine = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      { name, description, status },
      { new: true, runValidators: true }
    );

    if (!updatedMachine) {
      return res.status(404).json({ message: 'Machine not found.' });
    }

    res.status(200).json(updatedMachine);
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating machine.', error });
  }
};

// Delete a machine
exports.deleteMachine = async (req, res) => {
  try {
    const deletedMachine = await Machine.findByIdAndDelete(req.params.id);

    if (!deletedMachine) {
      return res.status(404).json({ message: 'Machine not found.' });
    }

    res.status(200).json({ message: 'Machine deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while deleting machine.', error });
  }
};

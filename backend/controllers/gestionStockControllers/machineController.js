const Machine = require("../../models/gestionStockModels/MachineModel")
const Factory = require("../../models/FactoryModel")

// Create a new machine
exports.createMachine = async (req, res) => {
  try {
    const { name, description, status, duration, factoryId } = req.body

    // Check if the machine already exists
    const existingMachine = await Machine.findOne({ name })
    if (existingMachine) {
      return res.status(400).json({ message: "Machine with this name already exists." })
    }

    // Verify that the factory exists
    if (!factoryId) {
      return res.status(400).json({ message: "Factory ID is required." })
    }

    const factory = await Factory.findById(factoryId)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    const machine = new Machine({
      name,
      description,
      status,
      duration: duration || 90, // Use provided duration or default to 90
      factoryId,
    })

    await machine.save()

    // Populate factory information before returning
    const populatedMachine = await Machine.findById(machine._id).populate({
      path: "factoryId",
      select: "name description",
      populate: {
        path: "categoryId",
        select: "name description",
      },
    })

    res.status(201).json(populatedMachine)
  } catch (error) {
    res.status(500).json({ message: "Server error while creating machine.", error })
  }
}

// Get all machines
exports.getAllMachines = async (req, res) => {
  try {
    const { factoryId, categoryId } = req.query

    const filter = {}
    if (factoryId) {
      filter.factoryId = factoryId
    }

    let machines = await Machine.find(filter)
      .populate({
        path: "factoryId",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name description",
        },
      })
      .sort({ name: 1 })

    // Filter by category if provided
    if (categoryId) {
      machines = machines.filter(
        (machine) =>
          machine.factoryId &&
          machine.factoryId.categoryId &&
          machine.factoryId.categoryId._id.toString() === categoryId,
      )
    }

    res.status(200).json(machines)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching machines.", error })
  }
}

// Get a single machine by ID
exports.getMachineById = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id).populate({
      path: "factoryId",
      select: "name description",
      populate: {
        path: "categoryId",
        select: "name description",
      },
    })

    if (!machine) {
      return res.status(404).json({ message: "Machine not found." })
    }
    res.status(200).json(machine)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching machine.", error })
  }
}

// Update a machine
exports.updateMachine = async (req, res) => {
  try {
    const { name, description, status, duration, factoryId } = req.body

    // Check if another machine with the same name exists (excluding current one)
    const existingMachine = await Machine.findOne({
      name,
      _id: { $ne: req.params.id },
    })
    if (existingMachine) {
      return res.status(400).json({ message: "Machine with this name already exists." })
    }

    // Verify that the factory exists if factoryId is provided
    if (factoryId) {
      const factory = await Factory.findById(factoryId)
      if (!factory) {
        return res.status(404).json({ message: "Factory not found." })
      }
    }

    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      { name, description, status, duration, factoryId },
      { new: true, runValidators: true },
    ).populate({
      path: "factoryId",
      select: "name description",
      populate: {
        path: "categoryId",
        select: "name description",
      },
    })

    if (!updatedMachine) {
      return res.status(404).json({ message: "Machine not found." })
    }

    res.status(200).json(updatedMachine)
  } catch (error) {
    res.status(500).json({ message: "Server error while updating machine.", error })
  }
}

// Delete a machine
exports.deleteMachine = async (req, res) => {
  try {
    const Call = require("../../models/logistic/CallModel")

    // Check if machine has associated calls
    const callsCount = await Call.countDocuments({
      machines: req.params.id,
    })
    if (callsCount > 0) {
      return res.status(400).json({
        message: "Cannot delete machine. It has associated calls.",
      })
    }

    const deletedMachine = await Machine.findByIdAndDelete(req.params.id)

    if (!deletedMachine) {
      return res.status(404).json({ message: "Machine not found." })
    }

    res.status(200).json({ message: "Machine deleted successfully." })
  } catch (error) {
    res.status(500).json({ message: "Server error while deleting machine.", error })
  }
}

// Get machines by factory
exports.getMachinesByFactory = async (req, res) => {
  try {
    const { factoryId } = req.params

    // Verify that the factory exists
    const factory = await Factory.findById(factoryId)
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    const machines = await Machine.find({ factoryId })
      .populate({
        path: "factoryId",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name description",
        },
      })
      .sort({ name: 1 })

    res.status(200).json(machines)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching machines by factory.", error })
  }
}

// Get machines by category
exports.getMachinesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params

    const machines = await Machine.find()
      .populate({
        path: "factoryId",
        select: "name description",
        populate: {
          path: "categoryId",
          select: "name description",
        },
      })
      .sort({ name: 1 })

    // Filter machines by category
    const filteredMachines = machines.filter(
      (machine) =>
        machine.factoryId && machine.factoryId.categoryId && machine.factoryId.categoryId._id.toString() === categoryId,
    )

    res.status(200).json(filteredMachines)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching machines by category.", error })
  }
}

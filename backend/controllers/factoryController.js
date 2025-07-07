const Factory = require("../models/FactoryModel")
const Category = require("../models/CategoryModel")

// Create a new factory
exports.createFactory = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body

    // Check if the factory already exists
    const existingFactory = await Factory.findOne({ name })
    if (existingFactory) {
      return res.status(400).json({ message: "Factory with this name already exists." })
    }

    // Verify that the category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found." })
    }

    const factory = new Factory({
      name,
      description,
      categoryId,
    })

    await factory.save()

    // Populate category information before returning
    const populatedFactory = await Factory.findById(factory._id).populate("categoryId", "name description")
    res.status(201).json(populatedFactory)
  } catch (error) {
    res.status(500).json({ message: "Server error while creating factory.", error })
  }
}

// Get all factories
exports.getAllFactories = async (req, res) => {
  try {
    const { categoryId } = req.query

    const filter = {}
    if (categoryId) {
      filter.categoryId = categoryId
    }

    const factories = await Factory.find(filter).populate("categoryId", "name description").sort({ name: 1 })

    res.status(200).json(factories)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching factories.", error })
  }
}

// Get a single factory by ID
exports.getFactoryById = async (req, res) => {
  try {
    const factory = await Factory.findById(req.params.id).populate("categoryId", "name description")
    if (!factory) {
      return res.status(404).json({ message: "Factory not found." })
    }
    res.status(200).json(factory)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching factory.", error })
  }
}

// Update a factory
exports.updateFactory = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body

    // Check if another factory with the same name exists (excluding current one)
    const existingFactory = await Factory.findOne({
      name,
      _id: { $ne: req.params.id },
    })
    if (existingFactory) {
      return res.status(400).json({ message: "Factory with this name already exists." })
    }

    // Verify that the category exists if categoryId is provided
    if (categoryId) {
      const category = await Category.findById(categoryId)
      if (!category) {
        return res.status(404).json({ message: "Category not found." })
      }
    }

    const updatedFactory = await Factory.findByIdAndUpdate(
      req.params.id,
      { name, description, categoryId },
      { new: true, runValidators: true },
    ).populate("categoryId", "name description")

    if (!updatedFactory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    res.status(200).json(updatedFactory)
  } catch (error) {
    res.status(500).json({ message: "Server error while updating factory.", error })
  }
}

// Delete a factory
exports.deleteFactory = async (req, res) => {
  try {
    const Machine = require("../models/gestionStockModels/MachineModel")

    // Check if factory has associated machines
    const machinesCount = await Machine.countDocuments({ factoryId: req.params.id })
    if (machinesCount > 0) {
      return res.status(400).json({
        message: "Cannot delete factory. It has associated machines.",
      })
    }

    const deletedFactory = await Factory.findByIdAndDelete(req.params.id)

    if (!deletedFactory) {
      return res.status(404).json({ message: "Factory not found." })
    }

    res.status(200).json({ message: "Factory deleted successfully." })
  } catch (error) {
    res.status(500).json({ message: "Server error while deleting factory.", error })
  }
}

// Get factories by category
exports.getFactoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params

    // Verify that the category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found." })
    }

    const factories = await Factory.find({ categoryId }).populate("categoryId", "name description").sort({ name: 1 })

    res.status(200).json(factories)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching factories by category.", error })
  }
}

const Category = require("../models/CategoryModel")

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body

    // Check if the category already exists
    const existingCategory = await Category.findOne({ name })
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this name already exists." })
    }

    const category = new Category({
      name,
      description,
    })

    await category.save()
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ message: "Server error while creating category.", error })
  }
}

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.status(200).json(categories)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching categories.", error })
  }
}

// Get a single category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: "Category not found." })
    }
    res.status(200).json(category)
  } catch (error) {
    res.status(500).json({ message: "Server error while fetching category.", error })
  }
}

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body

    // Check if another category with the same name exists (excluding current one)
    const existingCategory = await Category.findOne({
      name,
      _id: { $ne: req.params.id },
    })
    if (existingCategory) {
      return res.status(400).json({ message: "Category with this name already exists." })
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true, runValidators: true },
    )

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found." })
    }

    res.status(200).json(updatedCategory)
  } catch (error) {
    res.status(500).json({ message: "Server error while updating category.", error })
  }
}

// Delete a category with cascading deletes
exports.deleteCategory = async (req, res) => {
  try {
    const Factory = require("../models/FactoryModel")
    const Machine = require("../models/gestionStockModels/MachineModel")
    const Call = require("../models/logistic/CallModel")

    const categoryId = req.params.id

    // Check if category exists
    const category = await Category.findById(categoryId)
    if (!category) {
      return res.status(404).json({ message: "Category not found." })
    }

    // Find all factories associated with this category
    const factories = await Factory.find({ categoryId })
    const factoryIds = factories.map((factory) => factory._id)

    if (factoryIds.length > 0) {
      // Find all machines associated with these factories
      const machines = await Machine.find({ factoryId: { $in: factoryIds } })
      const machineIds = machines.map((machine) => machine._id)

      if (machineIds.length > 0) {
        // Delete all calls associated with these machines
        await Call.deleteMany({ machines: { $in: machineIds } })
        console.log(`Deleted calls associated with machines: ${machineIds}`)

        // Delete all machines associated with these factories
        await Machine.deleteMany({ factoryId: { $in: factoryIds } })
        console.log(`Deleted machines: ${machineIds}`)
      }

      // Delete all factories associated with this category
      await Factory.deleteMany({ categoryId })
      console.log(`Deleted factories: ${factoryIds}`)
    }

    // Finally, delete the category
    await Category.findByIdAndDelete(categoryId)

    res.status(200).json({
      message: "Category and all associated records deleted successfully.",
      deletedRecords: {
        category: 1,
        factories: factoryIds.length,
        machines: factoryIds.length > 0 ? await Machine.countDocuments({ factoryId: { $in: factoryIds } }) : 0,
        calls:
          factoryIds.length > 0
            ? await Call.countDocuments({
                machines: { $in: await Machine.find({ factoryId: { $in: factoryIds } }).distinct("_id") },
              })
            : 0,
      },
    })
  } catch (error) {
    console.error("Error deleting category:", error)
    res.status(500).json({ message: "Server error while deleting category.", error })
  }
}

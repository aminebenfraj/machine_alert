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

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const Factory = require("../models/FactoryModel")

    // Check if category has associated factories
    const factoriesCount = await Factory.countDocuments({ categoryId: req.params.id })
    if (factoriesCount > 0) {
      return res.status(400).json({
        message: "Cannot delete category. It has associated factories.",
      })
    }

    const deletedCategory = await Category.findByIdAndDelete(req.params.id)

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found." })
    }

    res.status(200).json({ message: "Category deleted successfully." })
  } catch (error) {
    res.status(500).json({ message: "Server error while deleting category.", error })
  }
}

const User = require("../models/UserModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ license: user.license, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// Register a New User
exports.registerUser = async (req, res) => {
  try {
    const { license, username, email, password, roles, image } = req.body

    // Validate required fields
    if (!license || !username || !email || !password) {
      return res.status(400).json({
        error: "Required fields missing",
      })
    }

    // Check if user already exists - optimized query
    const existingUser = await User.findOne({
      $or: [{ license }, { email }],
    })

    if (existingUser) {
      const duplicateField = existingUser.license === license ? "license" : "email"
      return res.status(400).json({
        error: `User with this ${duplicateField} already exists`,
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({
      license,
      username,
      email,
      password: hashedPassword,
      roles: roles || ["User"],
      image: image || null,
    })

    await user.save()

    res.status(201).json({
      message: "User registered successfully",
      user: {
        license: user.license,
        username: user.username,
        email: user.email,
        roles: user.roles,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ error: validationErrors.join(", ") })
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ error: `User with this ${field} already exists` })
    }

    res.status(500).json({ error: "Server error during registration" })
  }
}

// Login User - Optimized for performance
exports.loginUser = async (req, res) => {
  try {
    const { license, password } = req.body

    // Find user by license and select only necessary fields
    const user = await User.findOne({ license }).select("license username email roles image password")

    if (!user) {
      return res.status(400).json({ error: "Invalid license or password" })
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid license or password" })
    }

    // Generate token
    const token = jwt.sign({ license: user.license, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: "30d" })

    // Return user data without password
    const userData = {
      license: user.license,
      username: user.username,
      email: user.email,
      roles: user.roles,
      image: user.image,
      token,
    }

    res.json(userData)
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Server error" })
  }
}

// Get Current User - Simplified
exports.currentUser = async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    if (!req.user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Return user data without password
    res.json({
      license: req.user.license,
      username: req.user.username,
      email: req.user.email,
      roles: req.user.roles,
      image: req.user.image,
    })
  } catch (error) {
    console.error("Error fetching current user:", error)
    res.status(500).json({ error: "Server error" })
  }
}

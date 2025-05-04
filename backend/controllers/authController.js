const User = require("../models/UserModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()

// Generate JWT Token with improved error handling
const generateToken = (user) => {
  try {
    return jwt.sign(
      {
        license: user.license,
        roles: user.roles,
        // Add a unique identifier to prevent token reuse issues
        jti: require("crypto").randomBytes(16).toString("hex"),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    )
  } catch (error) {
    console.error("Token generation error:", error)
    throw new Error("Failed to generate authentication token")
  }
}

// Register a New User with improved validation and error handling
exports.registerUser = async (req, res) => {
  try {
    const { license, username, email, password, roles, image } = req.body

    // Enhanced validation with specific error messages
    if (!license) return res.status(400).json({ error: "License is required" })
    if (!username) return res.status(400).json({ error: "Username is required" })
    if (!email) return res.status(400).json({ error: "Email is required" })
    if (!password) return res.status(400).json({ error: "Password is required" })

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long" })
    }

    // Check if user already exists with more detailed error reporting
    try {
      const existingUser = await User.findOne({
        $or: [{ license }, { email }, { username }],
      })

      if (existingUser) {
        if (existingUser.license === license) {
          return res.status(400).json({ error: "User with this license already exists" })
        }
        if (existingUser.email === email) {
          return res.status(400).json({ error: "User with this email already exists" })
        }
        if (existingUser.username === username) {
          return res.status(400).json({ error: "Username is already taken" })
        }
      }
    } catch (dbError) {
      console.error("Database query error during registration:", dbError)
      return res.status(500).json({
        error: "Error checking existing users",
        details: process.env.NODE_ENV === "development" ? dbError.message : undefined,
      })
    }

    // Hash password with improved security
    const salt = await bcrypt.genSalt(12) // Increased from 10 to 12 for better security
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

    // Enhanced error handling with specific error types
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ error: validationErrors.join(", ") })
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ error: `User with this ${field} already exists` })
    }

    // Generic server error with logging
    console.error("Unexpected registration error:", error)
    res.status(500).json({
      error: "Server error during registration",
      requestId: Date.now().toString(36), // Add a request ID for tracking in logs
    })
  }
}

// Login User - Completely rewritten for reliability
exports.loginUser = async (req, res) => {
  const { license, password } = req.body

  // Input validation
  if (!license || !password) {
    return res.status(400).json({
      error: "Please provide both license and password",
    })
  }

  try {
    // Find user by license with retry mechanism
    let user = null
    let retryCount = 0
    const maxRetries = 2

    while (!user && retryCount <= maxRetries) {
      try {
        user = await User.findOne({ license }).select("+password")

        if (!user && retryCount < maxRetries) {
          // Wait a short time before retrying (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, retryCount)))
          retryCount++
        } else if (!user) {
          return res.status(401).json({
            error: "Invalid credentials",
            code: "INVALID_CREDENTIALS",
          })
        }
      } catch (dbError) {
        console.error(`Database error during login (attempt ${retryCount + 1}):`, dbError)

        if (retryCount < maxRetries) {
          retryCount++
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 200 * Math.pow(2, retryCount)))
        } else {
          throw dbError // Re-throw after max retries
        }
      }
    }

    // Compare password with retry mechanism for intermittent bcrypt issues
    let isMatch = false
    retryCount = 0

    while (retryCount <= maxRetries) {
      try {
        isMatch = await bcrypt.compare(password, user.password)
        break // Exit loop if comparison completes without error
      } catch (bcryptError) {
        console.error(`Bcrypt error during login (attempt ${retryCount + 1}):`, bcryptError)

        if (retryCount < maxRetries) {
          retryCount++
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 200 * Math.pow(2, retryCount)))
        } else {
          throw bcryptError // Re-throw after max retries
        }
      }
    }

    if (!isMatch) {
      // Use a consistent error message for security (don't reveal if user exists)
      return res.status(401).json({
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS",
      })
    }

    // Generate token with retry mechanism
    let token = null
    retryCount = 0

    while (!token && retryCount <= maxRetries) {
      try {
        token = generateToken(user)
      } catch (tokenError) {
        console.error(`Token generation error (attempt ${retryCount + 1}):`, tokenError)

        if (retryCount < maxRetries) {
          retryCount++
          await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, retryCount)))
        } else {
          throw tokenError // Re-throw after max retries
        }
      }
    }

    // Return user data without password
    const userData = {
      license: user.license,
      username: user.username,
      email: user.email,
      roles: user.roles,
      image: user.image,
      token,
    }

    // Set token in HTTP-only cookie for added security
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "strict",
    })

    res.json(userData)
  } catch (error) {
    console.error("Login error:", error)

    // Provide a request ID for tracking in logs
    const requestId = Date.now().toString(36)
    console.error(`Login error (request ${requestId}):`, error)

    res.status(500).json({
      error: "An error occurred during login. Please try again.",
      requestId,
      code: "SERVER_ERROR",
    })
  }
}

// Get Current User - Enhanced with better error handling
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
    res.status(500).json({
      error: "Server error while fetching user data",
      requestId: Date.now().toString(36),
    })
  }
}

// Logout user - New function to handle proper logout
exports.logoutUser = (req, res) => {
  try {
    // Clear the auth cookie
    res.clearCookie("token")
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ error: "Error during logout" })
  }
}

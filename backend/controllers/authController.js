const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// 🔹 Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { lisence: user.lisence, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// 🔹 Register a New User

exports.registerUser = async (req, res) => {
  try {
    const { license, username, email, password, roles, image } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // ✅ Ensure the password is hashed before storing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      license,
      username,
      email,
      password: hashedPassword, // ✅ Save hashed password
      roles: roles || ["User"],
      image: image || null
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully", user });

  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { license, password } = req.body;
    console.log("🔍 Login Request Received:");
    console.log("📧 License:", license);
    console.log("🔑 Entered Password:", password);

    // 1️⃣ Find user by license
    const user = await User.findOne({ license });

    if (!user) {
      console.log("❌ No user found with this license");
      return res.status(400).json({ error: "Invalid license or password" });
    }

    console.log("👤 User Found in Database:", user);
    console.log("🔹 Stored Hashed Password:", user.password);

    // 2️⃣ Compare entered password with stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    console.log("🔑 Password Match Status:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ error: "Invalid license or password" });
    }

    // 3️⃣ Generate JWT Token
    const token = jwt.sign(
      { license: user.license, roles: user.roles }, // ✅ Use correct field names
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    console.log("✅ Token Generated:", token);

    // 4️⃣ Send response
    res.json({
      license: user.license,
      username: user.username,
      email: user.email,
      roles: user.roles, // ✅ Use roles as an array
      image: user.image,
      token,
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Get Current Logged-in User (Protected)
exports.currentUser = async (req, res) => {
  try {
    if (req.user) {
      res.json({
        lisence: req.user.lisence,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        image: req.user.image,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

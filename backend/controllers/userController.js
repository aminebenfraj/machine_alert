const bcrypt = require("bcryptjs");
const User = require("../models/UserModel");

// 🎯 List of allowed roles from your schema
const rolesEnum = [
  "Admin", "Manager", "Project Manager", "Business Manager",
  "Financial Leader", "Manufacturing Eng. Manager",
  "Manufacturing Eng. Leader", "Tooling Manager",
  "Automation Leader", "SAP Leader", "Methodes UAP1&3",
  "Methodes UAP2", "Maintenance Manager",
  "Maintenance Leader UAP2", "Purchasing Manager",
  "Logistic Manager", "Logistic Leader UAP1",
  "Logistic Leader UAP2", "Logistic Leader",
  "POE Administrator", "Material Administrator",
  "Warehouse Leader UAP1", "Warehouse Leader UAP2",
  "Prod. Plant Manager UAP1", "Prod. Plant Manager UAP2",
  "Quality Manager", "Quality Leader UAP1",
  "Quality Leader UAP2", "Quality Leader UAP3",
  "Laboratory Leader", "Customer", "User","PRODUCCION", "LOGISTICA"
];

// 🔹 **Get Current User Information (Authenticated User)**
exports.showUserInfo = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.user.license }).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      license: user.license,
      username: user.username,
      email: user.email,
      roles: user.roles, // ✅ Returns multiple roles
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Error fetching user information" });
  }
};

// 🔹 **Admin: Update a User's Roles**
exports.updateUserRoles = async (req, res) => {
  const { roles } = req.body;

  // ✅ Ensure roles are valid
  if (!Array.isArray(roles) || roles.some(role => !rolesEnum.includes(role))) {
    return res.status(400).json({ error: "Invalid roles provided" });
  }

  try {
    // Find the user by license
    const user = await User.findOne({ license: req.params.license });
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Prevent Admin from removing their own "Admin" role
    if (user.license === req.user.license && !roles.includes("Admin")) {
      return res.status(400).json({ error: "You cannot remove your own Admin role" });
    }

    // ✅ Update roles
    user.roles = roles;
    await user.save();

    res.json({ message: "User roles updated successfully", updatedRoles: user.roles });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({ error: "Error updating user roles" });
  }
};

// 🔹 **Update Current User Information (Authenticated User)**
exports.updateCurrentUser = async (req, res) => {
  try {
    const { username, email, password, image } = req.body;

    const user = await User.findOne({ license: req.user.license });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (username) user.username = username;
    if (email) user.email = email;
    if (image) user.image = image;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.json({
      message: "User updated successfully",
      username: user.username,
      email: user.email,
      image: user.image,
    });
  } catch (error) {
    console.error("Error updating current user:", error);
    res.status(500).json({ error: "Error updating user information" });
  }
};

// 🔹 **Delete a User (Admin Only)**
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.params.license });
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Prevent Admin from deleting themselves
    if (user.license === req.user.license) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    await user.remove();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};

// 🔹 **Delete Current User Account (Self-Deletion)**
exports.deleteCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ license: req.user.license });
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.remove();
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select("-password"); // ✅ Exclude password

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // ✅ Ensure the user has a "Customer" role
    if (!customer.roles.includes("Customer")) {
      return res.status(403).json({ error: "User is not a customer" });
    }

    res.json(customer);
  } catch (error) {
    console.error("❌ Error fetching customer by ID:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// 🔹 **Get All Customers**
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ roles: "Customer" }).select("_id username email roles");

    if (!customers.length) {
      return res.status(404).json({ error: "No customers found" });
    }

    res.json(customers);
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};


exports.getRecentUsers = async (req, res) => {
  try {
    const recentUsers = await User.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(5) // Limit to the latest 5 users
      .select("username email roles createdAt"); // Select only required fields

    res.json(recentUsers);
  } catch (error) {
    console.error("Error fetching recent users:", error);
    res.status(500).json({ error: "Error fetching recent users" });
  }
};


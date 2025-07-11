const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Route imports
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const machineRoutes = require("./routes/gestionStockRoutes/machineRoutes");
const callRoutes = require("./routes/logistic/callRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const factoryRoutes = require("./routes/factoryRoutes");
const { initCronJobs } = require("./crone/callStatusCron");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
  cors({
    origin: [
      "https://machine-alert-frontend.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());

// Serve static files from the frontend build folder
app.use(express.static(path.join(__dirname, "build")));

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    initCronJobs(); // Start cron jobs after DB connects
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// API routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/factories", factoryRoutes);

// Catch-all route to serve index.html for non-API frontend routes
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next(); // Skip to 404 handler for unknown API routes
  }
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong!", error: err.message });
});

// 404 handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

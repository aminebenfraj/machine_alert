const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const userRoutes = require("./routes/userRoutes")
const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const machineRoutes = require("./routes/gestionStockRoutes/machineRoutes")
const callRoutes = require("./routes/logistic/callRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const factoryRoutes = require("./routes/factoryRoutes")
const { initCronJobs } = require("./crone/callStatusCron")
const path = require("path");


const app = express()
const PORT = process.env.PORT || 5000

// Updated CORS configuration to fix credentials issue
app.use(cors({
  origin: [
    'https://machine-alert-frontend.onrender.com',
    'http://localhost:3000', // For local development
    'http://localhost:5173'  // For Vite default port if you're using it
  ],
  credentials: true, // This is crucial for allowing cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.options('*', cors());
app.use(express.json())
app.use(express.static(path.join(__dirname, 'build'))); // Adjust if needed

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected")
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error)
  })

// Initialize cron jobs
initCronJobs()

// Routes
app.use("/api/users", userRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/machines", machineRoutes)
app.use("/api/calls", callRoutes) // Changed from "call" to "calls" for consistency
app.use("/api/categories", categoryRoutes) // Changed from "call" to "calls" for consistency
app.use("/api/factories", factoryRoutes) // Changed from "call" to "calls" for consistency
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html')); // Adjust if needed
});
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "Something went wrong!", error: err.message })
})

// 404 handler for routes that don't exist
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`)
})  
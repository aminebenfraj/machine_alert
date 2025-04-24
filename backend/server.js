const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const userRoutes = require('./routes/userRoutes');
const authRoutes = require("./routes/authRoutes"); 
const adminRoutes = require("./routes/adminRoutes");
const machineRoutes = require('./routes/gestionStockRoutes/machineRoutes');
const callRoutes = require("./routes/logistic/callRoutes") 
const { initCronJobs } = require("./crone/callStatusCron")


const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(() => {
    console.log('MongoDB connected');
  }).catch((error) => {
    console.error('MongoDB connection failed:', error);
  });

  
  initCronJobs()
app.use("/api/users", userRoutes); 
app.use("/api/auth", authRoutes); 
app.use("/api/admin", adminRoutes);
app.use('/api/machines', machineRoutes);
app.use("/api/call", callRoutes )


app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`)
})


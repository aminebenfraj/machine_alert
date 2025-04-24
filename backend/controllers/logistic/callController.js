const Call = require("../../models/logistic/CallModel")

// Get all calls with optional filtering
exports.getCalls = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    const { machineId, date, status } = req.query

    // Build filter object
    const filter = {}
    if (machineId) filter.machines = machineId
    if (status) filter.status = status
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      filter.date = { $gte: startDate, $lt: endDate }
    }

    // Populate the machines field to get machine details
    const calls = await Call.find(filter).populate("machines", "name description status").sort({ callTime: -1 })

    res.json(calls)
  } catch (error) {
    console.error("Error in getCalls:", error)
    res.status(500).json({ message: error.message })
  }
}

// Create a new call
exports.createCall = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    const { machineId } = req.body

    if (!machineId) {
      return res.status(400).json({ message: "Machine ID is required" })
    }

    // Determine the creator role from the user object
    let creatorRole = "PRODUCCION" // Default
    
    if (req.user.roles && Array.isArray(req.user.roles)) {
      if (req.user.roles.some(role => 
        role.toUpperCase() === "LOGISTICA" || role.toUpperCase() === "LOGÍSTICA")) {
        creatorRole = "LOGISTICA"
      }
    }

    const newCall = new Call({
      machines: [machineId], // Store as array of machine IDs
      createdBy: creatorRole,
      callTime: new Date(),
      date: new Date(),
      status: "Pendiente"
    })

    const savedCall = await newCall.save()

    // Populate the machine details before returning
    const populatedCall = await Call.findById(savedCall._id).populate("machines", "name description status")

    res.status(201).json(populatedCall)
  } catch (error) {
    console.error("Error in createCall:", error)
    res.status(500).json({ message: error.message })
  }
}

// Complete a call
exports.completeCall = async (req, res) => {
  try {
    const { id } = req.params

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    // Check if the user has the LOGISTICA role
    const isLogistics = req.user.roles && 
      Array.isArray(req.user.roles) && 
      req.user.roles.some(role => 
        role.toUpperCase() === "LOGISTICA" || role.toUpperCase() === "LOGÍSTICA")

    if (!isLogistics) {
      return res.status(403).json({ message: "Only LOGISTICA users can complete calls" })
    }

    const call = await Call.findById(id)

    if (!call) {
      return res.status(404).json({ message: "Call not found" })
    }

    call.status = "Realizada"
    call.completionTime = new Date()

    await call.save()

    res.json(call)
  } catch (error) {
    console.error("Error completing call:", error)
    res.status(500).json({ message: error.message })
  }
}

// Export calls to CSV
exports.exportCalls = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    // Get token from query params for direct browser access
    const { token, ...queryParams } = req.query
    
    const calls = await Call.find(queryParams).populate("machines", "name").sort({ callTime: -1 })

    // Format for CSV
    const csvData = [
      ["Nº DE MÁQUINA", "FECHA", "HORA LLAMADA", "TIEMPO RESTANTE", "ESTATUS", "HORA TAREA TERMINADA"],
      ...calls.map((call) => [
        call.machines
          .map((machine) => machine.name)
          .join(", "), // Join machine names if multiple
        new Date(call.date).toLocaleDateString(),
        new Date(call.callTime).toLocaleTimeString(),
        formatTime(call.remainingTime),
        call.status,
        call.completionTime ? new Date(call.completionTime).toLocaleTimeString() : "",
      ]),
    ]

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", "attachment; filename=tabla_logistica.csv")

    // Simple CSV formatting
    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    res.send(csvContent)
  } catch (error) {
    console.error("Error in exportCalls:", error)
    res.status(500).json({ message: error.message })
  }
}

// Check and update expired calls manually
exports.checkExpiredCalls = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    // Find all pending calls
    const pendingCalls = await Call.find({ status: "Pendiente" })

    let updatedCount = 0
    const errors = []

    // Check each call's remaining time
    for (const call of pendingCalls) {
      try {
        // Calculate remaining time
        const callTime = new Date(call.callTime).getTime()
        const currentTime = new Date().getTime()
        const elapsedSeconds = Math.floor((currentTime - callTime) / 1000)
        const totalSeconds = 90 * 60 // 90 minutes in seconds
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

        // If remaining time is 0, mark as expired
        if (remainingSeconds <= 0) {
          call.status = "Expirada"
          call.completionTime = new Date()
          await call.save()
          updatedCount++
        }
      } catch (callError) {
        console.error(`Error updating call ${call._id}:`, callError)
        errors.push({ id: call._id, error: callError.message })
      }
    }

    res.json({
      message: `${updatedCount} expired calls marked as completed`,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error in checkExpiredCalls:", error)
    res.status(500).json({ message: error.message })
  }
}

// Delete a call by ID
exports.deleteCall = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    const { id } = req.params

    // Check if the user has the LOGISTICA role
    const isLogistics = req.user.roles && 
      Array.isArray(req.user.roles) && 
      req.user.roles.some(role => 
        role.toUpperCase() === "LOGISTICA" || role.toUpperCase() === "LOGÍSTICA")

    if (!isLogistics) {
      return res.status(403).json({ message: "Only LOGISTICA users can delete calls" })
    }

    const deletedCall = await Call.findByIdAndDelete(id)

    if (!deletedCall) {
      return res.status(404).json({ message: "Call not found" })
    }

    res.status(200).json({ message: "Call deleted successfully" })
  } catch (error) {
    console.error("Error deleting call:", error)
    res.status(500).json({ message: error.message })
  }
}

// Helper function to format time
function formatTime(seconds) {
  if (seconds === null || seconds === undefined) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
}

const cron = require("node-cron")
const Call = require("../models/logistic/CallModel")

// Update the updateExpiredCalls function to use the call's duration
const updateExpiredCalls = async () => {
  try {
    console.log("🕒 Running scheduled task: Checking for expired calls...")

    // Find all pending calls
    const pendingCalls = await Call.find({ status: "Pendiente" })

    let updatedCount = 0

    // Check each call's remaining time using the call's duration
    for (const call of pendingCalls) {
      try {
        // Calculate remaining time
        const callTime = new Date(call.callTime).getTime()
        const currentTime = new Date().getTime()
        const elapsedSeconds = Math.floor((currentTime - callTime) / 1000)
        const totalSeconds = (call.duration || 90) * 60 // Use the call's duration or default to 90 minutes
        const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)

        // If remaining time is 0, mark as expired
        if (remainingSeconds <= 0) {
          // Don't modify the createdBy field to avoid validation errors
          call.status = "Expirada"
          call.completionTime = new Date()
          await call.save()
          updatedCount++
        }
      } catch (callError) {
        console.error(`❌ Error updating call ${call._id}:`, callError)
      }
    }

    console.log(`✅ Cron job completed: ${updatedCount} expired calls marked as completed`)
  } catch (error) {
    console.error("❌ Error in cron job:", error)
  }
}

// Schedule the cron job to run every minute
// Format: '* * * * *' (minute, hour, day of month, month, day of week)
const initCronJobs = () => {
  cron.schedule("* * * * *", updateExpiredCalls)
  console.log("🔄 Call status cron job initialized")
}

module.exports = { initCronJobs }

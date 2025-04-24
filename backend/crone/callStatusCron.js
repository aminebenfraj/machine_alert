const cron = require("node-cron")
const Call = require("../models/logistic/CallModel")

// Function to update expired calls
const updateExpiredCalls = async () => {
  try {
    console.log("🕒 Running scheduled task: Checking for expired calls...")

    // Find all pending calls
    const pendingCalls = await Call.find({ status: "Pendiente" })

    let updatedCount = 0

    // Check each call's remaining time
    for (const call of pendingCalls) {
      try {
        // If remaining time is 0, mark as expired
        if (call.remainingTime <= 0) {
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


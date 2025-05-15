const mongoose = require("mongoose")
const { Schema } = mongoose

const CallSchema = new Schema(
  {
    machines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Machine",
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    callTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Pendiente", "Realizada", "Expirada"],
      default: "Pendiente",
    },
    completionTime: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      required: true,
      enum: ["PRODUCCION", "LOGISTICA"],
    },
    duration: {
      type: Number,
      default: 90, // Default to 90 minutes for backward compatibility
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Update the virtual for remaining time to use the dynamic duration
CallSchema.virtual("remainingTime").get(function () {
  if (this.status === "Realizada" || this.status === "Expirada") return 0

  const callTime = new Date(this.callTime).getTime()
  const currentTime = new Date().getTime()
  const elapsedSeconds = Math.floor((currentTime - callTime) / 1000)
  const totalSeconds = (this.duration || 90) * 60 // Use the call's duration or default to 90 minutes

  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  return remainingSeconds
})

module.exports = mongoose.model("Call", CallSchema)

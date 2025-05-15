"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, AlertTriangle } from "lucide-react"
import { formatTime, calculateProgress } from "../apis/logistic/callApi"

export const CallTimer = ({ remainingTime, status, duration = 90 }) => {
  const [progress, setProgress] = useState(calculateProgress(remainingTime, duration))

  useEffect(() => {
    setProgress(calculateProgress(remainingTime, duration))
  }, [remainingTime, duration])

  if (status !== "Pendiente") {
    return <span className="text-muted-foreground">0:00</span>
  }

  // Determine color based on remaining time segments of the timer
  const getTimerColors = (time) => {
    // Calculate percentages based on the total duration
    const totalSeconds = duration * 60
    const criticalThreshold = totalSeconds * 0.167 // 1/6 of total time (15min of 90min)
    const warningThreshold = totalSeconds * 0.333 // 1/3 of total time (30min of 90min)
    const cautionThreshold = totalSeconds * 0.667 // 2/3 of total time (60min of 90min)

    if (time <= criticalThreshold) {
      // Critical: Less than 1/6 of total time
      return {
        bg: "bg-red-100",
        bar: "bg-red-600",
        text: "text-red-700",
        shadow: "shadow-red-500/50",
        pulse: true,
      }
    } else if (time <= warningThreshold) {
      // Warning: Less than 1/3 of total time
      return {
        bg: "bg-amber-100",
        bar: "bg-amber-500",
        text: "text-amber-700",
        shadow: "shadow-amber-500/50",
        pulse: false,
      }
    } else if (time <= cautionThreshold) {
      // Caution: Less than 2/3 of total time
      return {
        bg: "bg-blue-100",
        bar: "bg-blue-500",
        text: "text-blue-700",
        shadow: "shadow-blue-500/50",
        pulse: false,
      }
    } else {
      // Normal: More than 2/3 of total time
      return {
        bg: "bg-green-100",
        bar: "bg-green-500",
        text: "text-green-700",
        shadow: "shadow-green-500/50",
        pulse: false,
      }
    }
  }

  const colors = getTimerColors(remainingTime)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {remainingTime <= duration * 60 * 0.167 ? (
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        ) : remainingTime <= duration * 60 * 0.333 ? (
          <Clock className="w-4 h-4 text-amber-500" />
        ) : (
          <Clock className="w-4 h-4 text-blue-500" />
        )}
        <span className={`font-mono font-bold ${colors.text}`}>{formatTime(remainingTime)}</span>
      </div>

      <div className={`w-full h-3 rounded-full ${colors.bg} overflow-hidden shadow-sm`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${progress}%`,
            transition: { duration: 0.5 },
          }}
          className={`h-full rounded-full ${colors.bar} shadow-lg ${colors.shadow}`}
          style={{
            animation: colors.pulse ? "pulse 1.5s infinite" : "none",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

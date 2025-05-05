"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, AlertTriangle } from "lucide-react"
import { formatTime, calculateProgress } from "../apis/logistic/callApi"

export const CallTimer = ({ remainingTime, status }) => {
  const [progress, setProgress] = useState(calculateProgress(remainingTime))

  useEffect(() => {
    setProgress(calculateProgress(remainingTime))
  }, [remainingTime])

  if (status !== "Pendiente") {
    return <span className="text-muted-foreground">0:00</span>
  }

  // Determine color based on remaining time segments of the 90-minute timer
  const getTimerColors = (time) => {
    if (time <= 15 * 60) {
      // Critical: Less than 15 minutes
      return {
        bg: "bg-red-100",
        bar: "bg-red-600",
        text: "text-red-700",
        shadow: "shadow-red-500/50",
        pulse: true,
      }
    } else if (time <= 30 * 60) {
      // Warning: Less than 30 minutes
      return {
        bg: "bg-amber-100",
        bar: "bg-amber-500",
        text: "text-amber-700",
        shadow: "shadow-amber-500/50",
        pulse: false,
      }
    } else if (time <= 60 * 60) {
      // Caution: Less than 60 minutes
      return {
        bg: "bg-blue-100",
        bar: "bg-blue-500",
        text: "text-blue-700",
        shadow: "shadow-blue-500/50",
        pulse: false,
      }
    } else {
      // Normal: More than 60 minutes
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
        {remainingTime <= 15 * 60 ? (
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        ) : remainingTime <= 30 * 60 ? (
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

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatTime, calculateProgress } from "../apis/logistic/callApi"

export const CallTimer = ({ remainingTime, status }) => {
  const [progress, setProgress] = useState(calculateProgress(remainingTime))

  useEffect(() => {
    setProgress(calculateProgress(remainingTime))
  }, [remainingTime])

  if (status !== "Pendiente") {
    return <span className="text-muted-foreground">0:00</span>
  }

  // Determine color based on remaining time
  const getTimerVariant = (time) => {
    if (time <= 15 * 60) return "destructive" // Less than 15 minutes
    if (time <= 30 * 60) return "warning" // Less than 30 minutes
    return "outline"
  }

  const variant = getTimerVariant(remainingTime)

  return (
    <div className="space-y-1">
      <Badge variant={variant} className="px-3 py-1 font-mono text-base">
        {remainingTime <= 15 * 60 ? (
          <AlertTriangle className="w-4 h-4 mr-1 animate-pulse" />
        ) : remainingTime <= 30 * 60 ? (
          <Clock className="w-4 h-4 mr-1" />
        ) : null}
        {formatTime(remainingTime)}
      </Badge>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Progress
          value={progress}
          className={`h-2 ${
            remainingTime <= 15 * 60 ? "bg-red-200" : remainingTime <= 30 * 60 ? "bg-yellow-200" : "bg-gray-200"
          }`}
          indicatorClassName={
            remainingTime <= 15 * 60 ? "bg-red-500" : remainingTime <= 30 * 60 ? "bg-yellow-500" : "bg-blue-500"
          }
        />
      </motion.div>
    </div>
  )
}


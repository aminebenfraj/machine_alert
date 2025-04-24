"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Bell, Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { getCalls, formatTime, completeCall } from "../apis/logistic/callApi"
import { motion } from "framer-motion"

export const CallNotifications = ({ count: externalCount }) => {
  const [pendingCalls, setPendingCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const intervalRef = useRef(null)

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const calls = await getCalls({ status: "Pendiente" })

      // Ensure we have an array of calls
      const callsArray = Array.isArray(calls) ? calls : calls?.data ? (Array.isArray(calls.data) ? calls.data : []) : []

      // Sort calls by remaining time (ascending)
      const sortedCalls = callsArray.sort((a, b) => {
        const aTime = a.remainingTime || 0
        const bTime = b.remainingTime || 0
        return aTime - bTime
      })

      setPendingCalls(sortedCalls)
    } catch (error) {
      console.error("Failed to fetch pending calls:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // If popover is open, fetch calls immediately
    if (open) {
      fetchCalls()

      // Set up interval to refresh calls every 10 seconds when popover is open
      intervalRef.current = setInterval(fetchCalls, 10000)
    }

    // Clean up interval when popover closes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [open])

  // Handle call completion
  const handleCompleteCall = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      await completeCall(id)
      // Refresh calls after completion
      fetchCalls()
    } catch (error) {
      console.error(`Failed to complete call ${id}:`, error)
    }
  }

  // Get urgency class based on remaining time
  const getUrgencyClass = (remainingTime) => {
    if (remainingTime === undefined || remainingTime === null) return ""
    if (remainingTime <= 300) return "bg-rose-50 border-rose-200" // Less than 5 minutes
    if (remainingTime <= 900) return "bg-amber-50 border-amber-200" // Less than 15 minutes
    return "bg-slate-50 border-slate-200" // More than 15 minutes
  }

  // Get urgency icon based on remaining time
  const getUrgencyIcon = (remainingTime) => {
    if (remainingTime === undefined || remainingTime === null) {
      return <Clock className="w-4 h-4 text-slate-500" />
    }
    if (remainingTime <= 300) {
      return <AlertTriangle className="w-4 h-4 text-rose-500" />
    }
    if (remainingTime <= 900) {
      return <Clock className="w-4 h-4 text-amber-500" />
    }
    return <Clock className="w-4 h-4 text-slate-500" />
  }

  // Get progress bar color based on remaining time
  const getProgressColor = (remainingTime) => {
    if (remainingTime === undefined || remainingTime === null) return "bg-slate-300"
    if (remainingTime <= 300) return "bg-rose-500" // Less than 5 minutes
    if (remainingTime <= 900) return "bg-amber-500" // Less than 15 minutes
    return "bg-slate-500" // More than 15 minutes
  }

  // Calculate progress percentage for progress bar
  const calculateProgress = (remainingTime) => {
    if (remainingTime === undefined || remainingTime === null) return 100
    // Assuming 90 minutes (5400 seconds) is the max time
    const maxTime = 90 * 60
    const progress = Math.max(0, Math.min(100, (remainingTime / maxTime) * 100))
    return progress
  }

  // Get count of pending calls
  const pendingCount = externalCount !== undefined ? externalCount : pendingCalls.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-rose-500 text-white"
              variant="secondary"
            >
              {pendingCount > 99 ? "99+" : pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 shadow-lg w-80" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">Call Notifications</h3>
          {pendingCount > 0 && (
            <Badge variant="outline" className="bg-slate-100">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-3/4 h-4 rounded bg-slate-100 animate-pulse"></div>
                  <div className="w-1/2 h-3 rounded bg-slate-100 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-slate-100">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600">No pending calls</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[320px]">
            <div className="flex flex-col p-2 space-y-2">
              {pendingCalls.map((call) => (
                <motion.div
                  key={call._id || call.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/call`}
                    className={`flex flex-col p-3 rounded-lg border ${getUrgencyClass(call.remainingTime)} hover:bg-slate-100 transition-colors relative group`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <span className="font-medium truncate text-slate-900">
                            {call.location || "Unknown Location"}
                          </span>
                        </div>
                        <p className="mb-2 text-sm text-slate-600 line-clamp-2">
                          {call.description || "No description"}
                        </p>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-slate-200 rounded-full mb-2">
                          <div
                            className={`h-1.5 rounded-full ${getProgressColor(call.remainingTime)}`}
                            style={{ width: `${calculateProgress(call.remainingTime)}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-xs text-slate-500">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            <span>
                              {new Date(call.callTime).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                            <span className="mx-1">•</span>
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            <span>
                              {new Date(call.callTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <Badge
                            className={`flex items-center gap-1 ${
                              call.remainingTime <= 300
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : call.remainingTime <= 900
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                            variant="outline"
                          >
                            {getUrgencyIcon(call.remainingTime)}
                            <span>{formatTime(call.remainingTime || 0)}</span>
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Complete button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100"
                      onClick={(e) => handleCompleteCall(call._id || call.id, e)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-xs">Complete</span>
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Separator />

        <div className="flex items-center justify-between px-4 py-2">
          <Button variant="link" size="sm" asChild className="text-slate-600">
            <Link to="/call" onClick={() => setOpen(false)}>
              View all calls
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCalls} className="text-slate-600">
            Refresh
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

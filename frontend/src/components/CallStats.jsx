"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertTriangle, Activity } from "lucide-react"

export const CallStats = ({ calls }) => {
  const stats = useMemo(() => {
    const pendingCalls = calls.filter((call) => call.status === "Pendiente").length
    const completedCalls = calls.filter((call) => call.status === "Realizada").length
    const expiredCalls = calls.filter((call) => call.status === "Expirada").length
    const totalCalls = calls.length

    // Calculate average response time for completed calls
    const completedCallsWithTime = calls.filter(
      (call) => call.status === "Realizada" && call.completionTime && call.callTime,
    )

    let avgResponseTime = 0
    if (completedCallsWithTime.length > 0) {
      const totalResponseTime = completedCallsWithTime.reduce((total, call) => {
        const callTime = new Date(call.callTime).getTime()
        const completionTime = new Date(call.completionTime).getTime()
        return total + (completionTime - callTime) / 1000 // in seconds
      }, 0)
      avgResponseTime = totalResponseTime / completedCallsWithTime.length
    }

    // Format average response time
    const formatAvgTime = (seconds) => {
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${minutes}m ${remainingSeconds}s`
    }

    return {
      pendingCalls,
      completedCalls,
      expiredCalls,
      totalCalls,
      avgResponseTime: formatAvgTime(avgResponseTime),
    }
  }, [calls])

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCalls}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <Clock className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingCalls}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          <CheckCircle className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedCalls}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgResponseTime}</div>
        </CardContent>
      </Card>
    </div>
  )
}


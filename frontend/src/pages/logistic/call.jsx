"use client"
import { Trash2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getCalls, createCall, completeCall, checkExpiredCalls, exportCalls, deleteCall } from "@/apis/logistic/callApi"
import { getAllMachines } from "@/apis/gestionStockApi/machineApi"
import { useAuth } from "@/context/AuthContext"
import { CallTimer } from "@/components/CallTimer"
import { CallStats } from "@/components/CallStats"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  Filter,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  PhoneCall,
  RotateCw,
  Calendar,
  Info,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const CallDashboard = () => {
  // Get the current user from auth context
  const { user } = useAuth()

  const [selectedMachine, setSelectedMachine] = useState(null)
  const [machines, setMachines] = useState([])
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creatingCall, setCreatingCall] = useState(false)
  const [checkingExpired, setCheckingExpired] = useState(false)
  const [completingCall, setCompletingCall] = useState({})
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState({
    machineId: "all",
    date: "",
    status: "all",
  })

  // Ref for the interval timer
  const timerRef = useRef(null)

  useEffect(() => {
    fetchCalls()
    fetchMachines()

    // Set up interval to update remaining time every second
    timerRef.current = setInterval(() => {
      updateRemainingTime()
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const fetchMachines = async () => {
    try {
      console.log("Fetching machines...")
      const response = await getAllMachines()
      console.log("Machines response:", response)

      // Check if response is directly an array (not wrapped in a data property)
      if (Array.isArray(response)) {
        console.log("Machines data is directly an array:", response)

        // Only show active machines in the dropdown
        const activeMachines = response.filter((machine) => machine.status === "active")
        console.log("Active machines:", activeMachines)

        setMachines(activeMachines)
      }
      // Check if response has a data property that is an array
      else if (response && response.data && Array.isArray(response.data)) {
        console.log("Machines data in response.data:", response.data)

        // Only show active machines in the dropdown
        const activeMachines = response.data.filter((machine) => machine.status === "active")
        console.log("Active machines:", activeMachines)

        setMachines(activeMachines)
      } else {
        console.warn("No valid machines data found in response")
        setMachines([])
      }
    } catch (error) {
      console.error("Error fetching machines:", error)
      setMachines([])
    }
  }

  const fetchCalls = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      if (silent) setRefreshing(true)

      // Convert filter values for API
      const apiFilters = { ...filters }
      if (apiFilters.machineId === "all") apiFilters.machineId = ""
      if (apiFilters.status === "all") apiFilters.status = ""

      const callsData = await getCalls(apiFilters)
      setCalls(callsData)
    } catch (error) {
      console.error("Error fetching calls:", error)
      setCalls([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Update the remaining time for all calls
  const updateRemainingTime = () => {
    setCalls((prevCalls) => {
      return prevCalls.map((call) => {
        if (call.status === "Pendiente") {
          // If timer has reached zero
          if (call.remainingTime <= 1) {
            return {
              ...call,
              status: "Expirada",
              remainingTime: 0,
            }
          }

          // Otherwise, decrement the timer
          return {
            ...call,
            remainingTime: call.remainingTime - 1,
          }
        }
        return call
      })
    })
  }

  const handleCallLogistics = async () => {
    if (!selectedMachine) {
      toast({
        title: "Error",
        description: "Por favor selecciona una máquina",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingCall(true)
      console.log("Creating call for machine:", selectedMachine)

      // Find the selected machine to get its name
      const selectedMachineObj = machines.find((m) => m._id === selectedMachine)

      // Create a new call with the machine ID, current date, and user
      const callData = {
        machineId: selectedMachine,
        callTime: new Date(),
        date: new Date(),
        status: "Pendiente",
        createdBy: user?.roles?.includes("PRODUCCION") ? "PRODUCCION" : "LOGISTICA",
      }

      console.log("Call data:", callData)
      const response = await createCall(callData)

      // Get the created call data
      let newCall
      if (response && response.data) {
        newCall = response.data

        // Ensure the new call has a remainingTime property
        if (!newCall.remainingTime && newCall.remainingTime !== 0) {
          newCall.remainingTime = 90 * 60 // 90 minutes in seconds
        }
      } else {
        newCall = {
          _id: Date.now().toString(), // Fallback ID if not provided by API
          ...callData,
          remainingTime: 90 * 60, // 90 minutes in seconds
          machines: [{ name: selectedMachineObj?.name || "Máquina seleccionada" }],
        }
      }

      // Add the new call to the calls array
      setCalls((prevCalls) => [newCall, ...prevCalls])

      // Reset the selected machine
      setSelectedMachine(null)

      // Show success toast
      toast({
        title: "Llamada creada",
        description: "Se ha creado una llamada a LOGISTICA exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating call:", error)

      // Show error toast
      toast({
        title: "Error",
        description: "No se pudo crear la llamada a LOGISTICA",
        variant: "destructive",
      })
    } finally {
      setCreatingCall(false)
    }
  }

  const handleMachineSelect = (machineId) => {
    console.log("Machine selected:", machineId)
    setSelectedMachine(machineId)
  }

  const handleCompleteCall = async (id) => {
    try {
      // Set loading state for this specific call
      setCompletingCall((prev) => ({ ...prev, [id]: true }))

      // Get the current time for completion
      const completionTime = new Date()

      // Get the user role from the auth context
      const userRole = user?.roles?.includes("LOGISTICA") ? "LOGISTICA" : "PRODUCCION"

      // Call the API to update the server FIRST
      // Pass the user role to ensure proper authorization
      await completeCall(id, userRole)

      // Then update the local state after successful API call
      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call._id === id
            ? {
                ...call,
                status: "Realizada",
                completionTime: completionTime,
                remainingTime: 0, // Explicitly set remaining time to 0
              }
            : call,
        ),
      )

      // Show success toast
      toast({
        title: "Llamada completada",
        description: "La llamada ha sido marcada como completada",
        variant: "success",
      })
    } catch (error) {
      console.error("Error completing call:", error)

      // Show error toast with more specific message
      const errorMessage = error.response?.data?.message || "No se pudo completar la llamada"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      // Refresh calls to ensure UI is in sync with server
      fetchCalls(true)
    } finally {
      // Clear loading state for this call
      setCompletingCall((prev) => {
        const newState = { ...prev }
        delete newState[id]
        return newState
      })
    }
  }

  const handleCheckExpiredCalls = async () => {
    try {
      setCheckingExpired(true)

      // Call the API to check expired calls
      const response = await checkExpiredCalls()

      // Refresh the calls list
      await fetchCalls(true)

      // Show success toast
      toast({
        title: "Verificación completada",
        description: response.data.message || "Se han verificado las llamadas expiradas",
        variant: "success",
      })
    } catch (error) {
      console.error("Error checking expired calls:", error)

      // Show error toast
      toast({
        title: "Error",
        description: "No se pudieron verificar las llamadas expiradas",
        variant: "destructive",
      })
    } finally {
      setCheckingExpired(false)
    }
  }

  const handleExportToExcel = () => {
    // Convert filter values for API
    const apiFilters = { ...filters }
    if (apiFilters.machineId === "all") apiFilters.machineId = ""
    if (apiFilters.status === "all") apiFilters.status = ""

    exportCalls(apiFilters)
  }

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const applyFilters = () => {
    fetchCalls()
  }

  // Get machine names for display
  const getMachineNames = (call) => {
    if (!call.machines || call.machines.length === 0) return "-"
    return call.machines.map((machine) => machine.name).join(", ")
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Realizada":
        return "success"
      case "Expirada":
        return "destructive"
      case "Pendiente":
        return "secondary"
      default:
        return "outline"
    }
  }
  const handleDeleteCall = async (id) => {
    const confirm = window.confirm("¿Estás seguro de que quieres eliminar esta llamada?")
    if (!confirm) return

    try {
      await deleteCall(id)
      alert("Llamada eliminada correctamente")
      fetchCalls() // Refresh the list after deletion
    } catch (error) {
      console.error("Error al eliminar la llamada:", error)
      alert("Error al eliminar la llamada")
    }
  }

  const handleDeleteAllExceptFirst10 = async () => {
    const confirm = window.confirm("¿Estás seguro de que quieres eliminar todas las llamadas excepto las primeras 10?")
    if (!confirm) return

    try {
      // Get all calls except the first 10
      const callsToDelete = calls.slice(10)

      // Show loading toast
      toast({
        title: "Eliminando llamadas",
        description: `Eliminando ${callsToDelete.length} llamadas...`,
        variant: "default",
      })

      // Delete each call
      let deletedCount = 0
      for (const call of callsToDelete) {
        try {
          await deleteCall(call._id)
          deletedCount++
        } catch (error) {
          console.error(`Error al eliminar la llamada ${call._id}:`, error)
        }
      }

      // Show success toast
      toast({
        title: "Llamadas eliminadas",
        description: `Se han eliminado ${deletedCount} llamadas correctamente`,
        variant: "success",
      })

      // Refresh the calls list
      fetchCalls()
    } catch (error) {
      console.error("Error al eliminar las llamadas:", error)

      // Show error toast
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar las llamadas",
        variant: "destructive",
      })
    }
  }
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Realizada":
        return <CheckCircle className="w-3 h-3 mr-1" />
      case "Expirada":
        return <XCircle className="w-3 h-3 mr-1" />
      case "Pendiente":
        return <Clock className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  // Filter calls based on active tab
  const filteredCalls = calls.filter((call) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return call.status === "Pendiente"
    if (activeTab === "completed") return call.status === "Realizada"
    if (activeTab === "expired") return call.status === "Expirada"
    return true
  })

  // Check if user has the LOGISTICA role
  const isLogistics = user?.roles?.includes("LOGISTICA")
  // Check if user has the PRODUCCION role
  const isProduction = user?.roles?.includes("PRODUCCION")

  // If user is not authenticated or doesn't have either role, show loading or unauthorized message
  if (!user) {
    return (
      <div className="container py-6 mx-auto flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 mr-2 animate-spin" />
        <span>Cargando información de usuario...</span>
      </div>
    )
  }

  if (!isLogistics && !isProduction) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-6 mx-auto"
      >
        <h1 className="text-3xl font-bold tracking-tight text-center">Acceso no autorizado</h1>
        <p className="mt-4 text-center">No tienes permisos para acceder a este módulo. Contacta al administrador.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container py-6 mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              Usuario:{" "}
              <Badge variant="outline" className="ml-1 font-mono">
                {isProduction ? "PRODUCCION" : "LOGISTICA"}
              </Badge>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isLogistics && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleCheckExpiredCalls} disabled={checkingExpired}>
                    {checkingExpired ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verificar llamadas expiradas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <Separator />

      {/* Statistics Cards */}
      <CallStats calls={calls} />

      {isProduction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Llamar a LOGISTICA</CardTitle>
              <CardDescription>Selecciona una máquina para crear una llamada a LOGISTICA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <Label htmlFor="machineSelect">Seleccionar máquina</Label>
                  <div className="flex gap-2 mt-1">
                    <div className="flex-1">
                      <Select value={selectedMachine || ""} onValueChange={handleMachineSelect}>
                        <SelectTrigger id="machineSelect">
                          <SelectValue placeholder="Seleccionar máquina" />
                        </SelectTrigger>
                        <SelectContent>
                          {machines && machines.length > 0 ? (
                            machines.map((machine) => (
                              <SelectItem key={machine._id} value={machine._id}>
                                {machine.name} {machine.status !== "active" && `(${machine.status})`}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-machines" disabled>
                              No hay máquinas disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCallLogistics}
                      disabled={!selectedMachine || creatingCall}
                      className="flex items-center gap-2"
                    >
                      {creatingCall ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                      Llamar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle>Registro de Llamadas</CardTitle>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportToExcel}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Exportar
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar datos a CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteAllExceptFirst10}
                        className="flex items-center gap-2 mr-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar excepto 10
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar todas las llamadas excepto las primeras 10</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filterMachine">Máquina</Label>
                <Select value={filters.machineId} onValueChange={(value) => handleFilterChange("machineId", value)}>
                  <SelectTrigger id="filterMachine">
                    <SelectValue placeholder="Todas las máquinas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las máquinas</SelectItem>
                    {machines.map((machine) => (
                      <SelectItem key={machine._id} value={machine._id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterDate">Fecha</Label>
                <Input
                  id="filterDate"
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filterStatus">Estatus</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger id="filterStatus">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Expirada">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                  <Button onClick={applyFilters} className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                </motion.div>
              </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="completed">Completadas</TabsTrigger>
                <TabsTrigger value="expired">Expiradas</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Nº DE MÁQUINA</TableHead>
                    <TableHead className="font-bold">FECHA</TableHead>
                    <TableHead className="font-bold">HORA LLAMADA</TableHead>
                    <TableHead className="font-bold">TIEMPO RESTANTE</TableHead>
                    <TableHead className="font-bold">ESTATUS</TableHead>
                    <TableHead className="font-bold">ACCIÓN</TableHead>
                    <TableHead className="font-bold">HORA TAREA TERMINADA</TableHead>
                    <TableHead className="font-bold">DELETE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          <span>Cargando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No hay llamadas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {filteredCalls.map((call) => (
                        <motion.tr
                          key={call._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">{getMachineNames(call)}</TableCell>
                          <TableCell>{new Date(call.date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(call.callTime).toLocaleTimeString()}</TableCell>
                          <TableCell>
                            <CallTimer remainingTime={call.remainingTime} status={call.status} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(call.status)}>
                              {getStatusIcon(call.status)}
                              {call.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isLogistics && call.status === "Pendiente" && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                {completingCall[call._id] ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Checkbox onCheckedChange={() => handleCompleteCall(call._id)} className="w-5 h-5" />
                                )}
                              </motion.div>
                            )}
                            {call.status === "Realizada" && <Checkbox checked disabled className="w-5 h-5" />}
                            {call.status === "Expirada" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-5 h-5 text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Llamada expirada automáticamente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell>
                            {call.completionTime ? new Date(call.completionTime).toLocaleTimeString() : "-"}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCall(call._id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>{" "}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default CallDashboard

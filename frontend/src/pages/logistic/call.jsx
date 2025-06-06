"use client"
import { Trash2 } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Download,
  Filter,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  PhoneCall,
  Calendar,
  Info,
  RotateCw,
  ChevronDown,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Call Dashboard Component - Optimized for Tablet
 *
 * Displays and manages calls between production and logistics teams
 */
const CallDashboard = () => {
  // Get the current user from auth context
  const { user } = useAuth()

  const [selectedMachine, setSelectedMachine] = useState(null)
  const [selectedMachineDuration, setSelectedMachineDuration] = useState(90) // Default duration from selected machine
  const [machines, setMachines] = useState([])
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creatingCall, setCreatingCall] = useState(false)
  const [creatingMoleCall, setCreatingMoleCall] = useState(false)
  const [checkingExpired, setCheckingExpired] = useState(false)
  const [completingCall, setCompletingCall] = useState({})
  const [activeTab, setActiveTab] = useState("all")
  const [filters, setFilters] = useState({
    machineId: "all",
    date: "",
    status: "all",
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Check if user has the LOGISTICA role
  const isLogistics = useMemo(() => user?.roles?.includes("LOGISTICA"), [user?.roles])

  // Check if user has the PRODUCCION role
  const isProduction = useMemo(() => user?.roles?.includes("PRODUCCION"), [user?.roles])

  /**
   * Fetches calls from the API with optional filters
   * @param {boolean} silent - Whether to show loading indicators
   */
  const fetchCalls = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true)
        setRefreshing(true)

        // Convert filter values for API
        const apiFilters = { ...filters }
        if (apiFilters.machineId === "all") delete apiFilters.machineId
        if (apiFilters.status === "all") delete apiFilters.status
        if (!apiFilters.date) delete apiFilters.date

        const callsData = await getCalls(apiFilters)

        // Only update calls if we got valid data
        if (callsData && Array.isArray(callsData)) {
          setCalls(callsData)
          // Reset to first page when filters change (only for non-silent calls)
          if (!silent) {
            setCurrentPage(1)
          }
        } else {
          console.warn("Invalid calls data received:", callsData)
          // Don't clear existing data on invalid response
          if (!silent) {
            toast({
              title: "Advertencia",
              description: "No se pudieron cargar las llamadas correctamente",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Error fetching calls:", error)

        // Only clear calls and show error for non-silent requests
        if (!silent) {
          setCalls([])
          toast({
            title: "Error",
            description: "Error al cargar las llamadas",
            variant: "destructive",
          })
        } else {
          // For silent requests, just log the error but don't clear data
          console.warn("Silent fetch failed, keeping existing data")
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filters],
  )

  /**
   * Fetches machines from the API
   */
  const fetchMachines = useCallback(async () => {
    try {
      console.log("Fetching machines...")
      const response = await getAllMachines()

      // Check if response is directly an array (not wrapped in a data property)
      if (Array.isArray(response)) {
        // Only show active machines in the dropdown
        const activeMachines = response.filter((machine) => machine.status === "active")
        setMachines(activeMachines)
      }
      // Check if response has a data property that is an array
      else if (response && response.data && Array.isArray(response.data)) {
        // Only show active machines in the dropdown
        const activeMachines = response.data.filter((machine) => machine.status === "active")
        setMachines(activeMachines)
      } else {
        console.warn("No valid machines data found in response")
        setMachines([])
      }
    } catch (error) {
      console.error("Error fetching machines:", error)
      setMachines([])
    }
  }, [])

  // Update the remaining time for all calls
  const updateRemainingTime = useCallback(() => {
    setCalls((prevCalls) => {
      // Don't update if there are no calls
      if (!prevCalls || prevCalls.length === 0) {
        return prevCalls
      }

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
  }, [])

  /**
   * Handles checking for expired calls
   * @param {boolean} silent - Whether to show loading indicators and toasts
   */
  const handleCheckExpiredCalls = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setCheckingExpired(true)

        // Call the API to check expired calls
        const response = await checkExpiredCalls()

        // Refresh the calls list only if the expired check was successful
        if (response) {
          await fetchCalls(true)
        }

        // Show success toast only if not silent
        if (!silent) {
          toast({
            title: "Verificación completada",
            description: response.data?.message || "Se han verificado las llamadas expiradas",
            variant: "success",
          })
        }
      } catch (error) {
        console.error("Error checking expired calls:", error)

        // Show error toast only if not silent
        if (!silent) {
          toast({
            title: "Error",
            description: "No se pudieron verificar las llamadas expiradas",
            variant: "destructive",
          })
        } else {
          // For silent requests, just log the error
          console.warn("Silent expired check failed")
        }
      } finally {
        if (!silent) setCheckingExpired(false)
      }
    },
    [fetchCalls],
  )

  useEffect(() => {
    fetchCalls()
    fetchMachines()

    // Set up interval to update remaining time every second
    const timerInterval = setInterval(() => {
      updateRemainingTime()
    }, 1000)

    // Set up interval to check expired calls and refresh data every 15 seconds
    const refreshInterval = setInterval(() => {
      // Only refresh if user is active and page is visible
      if (document.visibilityState === "visible") {
        if (isLogistics) {
          // Check expired calls in the background (silently)
          handleCheckExpiredCalls(true)
        } else {
          // For non-logistics users, just refresh the calls data
          fetchCalls(true)
        }
      }
    }, 15000) // 15 seconds

    return () => {
      clearInterval(timerInterval)
      clearInterval(refreshInterval)
    }
  }, [fetchCalls, fetchMachines, handleCheckExpiredCalls, isLogistics, updateRemainingTime])

  /**
   * Handles creating a new call to logistics
   */
  const handleCallLogistics = useCallback(async () => {
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

      // Find the selected machine to get its name and duration
      const selectedMachineObj = machines.find((m) => m._id === selectedMachine)

      // Create a new call with the machine ID, current date, user, and duration from the machine
      const callData = {
        machineId: selectedMachine,
        callTime: new Date(),
        date: new Date(),
        status: "Pendiente",
        createdBy: user?.roles?.includes("PRODUCCION") ? "PRODUCCION" : "LOGISTICA",
        // No need to specify duration as it will use the machine's duration
      }

      console.log("Call data:", callData)
      const response = await createCall(callData)

      // Get the created call data
      let newCall
      if (response && response.data) {
        newCall = response.data

        // Ensure the new call has a remainingTime property
        if (!newCall.remainingTime && newCall.remainingTime !== 0) {
          newCall.remainingTime = (newCall.duration || selectedMachineObj.duration || 90) * 60 // Use call's duration in seconds
        }
      } else {
        newCall = {
          _id: Date.now().toString(), // Fallback ID if not provided by API
          ...callData,
          remainingTime: (selectedMachineObj.duration || 90) * 60, // Use machine's duration in seconds
          machines: [{ name: selectedMachineObj?.name || "Máquina seleccionada" }],
        }
      }

      // Add the new call to the calls array
      setCalls((prevCalls) => [newCall, ...prevCalls])

      // Reset the selected machine
      setSelectedMachine(null)

      // Refresh the calls list to ensure proper rendering of the timer
      fetchCalls(true)

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
  }, [machines, selectedMachine, user?.roles, fetchCalls])

  /**
   * Handles creating a new mole call to logistics (30 min timer)
   */
  const handleMoleCall = useCallback(async () => {
    if (!selectedMachine) {
      toast({
        title: "Error",
        description: "Por favor selecciona una máquina",
        variant: "destructive",
      })
      return
    }

    try {
      setCreatingMoleCall(true)
      console.log("Creating mole call for machine:", selectedMachine)

      // Find the selected machine to get its name
      const selectedMachineObj = machines.find((m) => m._id === selectedMachine)

      // Create a new mole call with 30 minutes duration
      const callData = {
        machineId: selectedMachine,
        callTime: new Date(),
        date: new Date(),
        status: "Pendiente",
        createdBy: user?.roles?.includes("PRODUCCION") ? "PRODUCCION" : "LOGISTICA",
        duration: 30, // Override to 30 minutes for mole calls
        callType: "mole", // Mark as mole call
      }

      console.log("Mole call data:", callData)
      const response = await createCall(callData)

      // Get the created call data
      let newCall
      if (response && response.data) {
        newCall = response.data

        // Ensure the new call has a remainingTime property (30 minutes = 1800 seconds)
        if (!newCall.remainingTime && newCall.remainingTime !== 0) {
          newCall.remainingTime = 30 * 60 // 30 minutes in seconds
        }
      } else {
        newCall = {
          _id: Date.now().toString(), // Fallback ID if not provided by API
          ...callData,
          remainingTime: 30 * 60, // 30 minutes in seconds
          machines: [{ name: selectedMachineObj?.name || "Máquina seleccionada" }],
        }
      }

      // Add the new call to the calls array
      setCalls((prevCalls) => [newCall, ...prevCalls])

      // Reset the selected machine
      setSelectedMachine(null)

      // Refresh the calls list to ensure proper rendering of the timer
      fetchCalls(true)

      // Show success toast
      toast({
        title: "Llamada Cambio molde creada",
        description: "Se ha creado una llamada de Cambio molde (30 min) a LOGISTICA exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating mole call:", error)

      // Show error toast
      toast({
        title: "Error",
        description: "No se pudo crear la llamada de Cambio molde a LOGISTICA",
        variant: "destructive",
      })
    } finally {
      setCreatingMoleCall(false)
    }
  }, [machines, selectedMachine, user?.roles, fetchCalls])

  /**
   * Handles selecting a machine from the dropdown
   * @param {string} machineId - The ID of the selected machine
   */
  const handleMachineSelect = useCallback(
    (machineId) => {
      console.log("Machine selected:", machineId)
      setSelectedMachine(machineId)

      // Find the selected machine to get its duration
      const selectedMachineObj = machines.find((m) => m._id === machineId)
      if (selectedMachineObj) {
        setSelectedMachineDuration(selectedMachineObj.duration || 90)
      }
    },
    [machines],
  )

  /**
   * Handles marking a call as completed
   * @param {string} id - The ID of the call to complete
   */
  const handleCompleteCall = useCallback(
    async (id) => {
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
    },
    [fetchCalls, user?.roles],
  )

  /**
   * Handles exporting calls to Excel
   */
  const handleExportToExcel = useCallback(() => {
    // Convert filter values for API
    const apiFilters = { ...filters }
    if (apiFilters.machineId === "all") delete apiFilters.machineId
    if (apiFilters.status === "all") delete apiFilters.status
    if (!apiFilters.date) delete apiFilters.date

    exportCalls(apiFilters)
  }, [filters])

  /**
   * Handles changing a filter value
   * @param {string} name - The name of the filter
   * @param {string} value - The new value for the filter
   */
  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }, [])

  /**
   * Handles applying filters to the calls list
   */
  const applyFilters = useCallback(() => {
    fetchCalls()
  }, [fetchCalls])

  /**
   * Handles deleting a call
   * @param {string} id - The ID of the call to delete
   */
  const handleDeleteCall = useCallback(
    async (id) => {
      const confirm = window.confirm("¿Estás seguro de que quieres eliminar esta llamada?")
      if (!confirm) return

      try {
        await deleteCall(id)
        toast({
          title: "Llamada eliminada",
          description: "La llamada ha sido eliminada correctamente",
          variant: "success",
        })
        fetchCalls() // Refresh the list after deletion
      } catch (error) {
        console.error("Error al eliminar la llamada:", error)
        toast({
          title: "Error",
          description: "Error al eliminar la llamada",
          variant: "destructive",
        })
      }
    },
    [fetchCalls],
  )

  /**
   * Handles deleting all calls except the first 10
   */
  const handleDeleteAllExceptFirst10 = useCallback(async () => {
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
  }, [calls, fetchCalls])

  // Get machine names for display
  const getMachineNames = useCallback((call) => {
    if (!call.machines || call.machines.length === 0) return "-"
    return call.machines.map((machine) => machine.name).join(", ")
  }, [])

  // Get status badge variant
  const getStatusBadgeVariant = useCallback((status) => {
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
  }, [])

  // Get status icon
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "Realizada":
        return <CheckCircle className="w-4 h-4 mr-1" />
      case "Expirada":
        return <XCircle className="w-4 h-4 mr-1" />
      case "Pendiente":
        return <Clock className="w-4 h-4 mr-1" />
      default:
        return null
    }
  }, [])

  // Filter calls based on active tab
  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      if (activeTab === "all") return true
      if (activeTab === "pending") return call.status === "Pendiente"
      if (activeTab === "completed") return call.status === "Realizada"
      if (activeTab === "expired") return call.status === "Expirada"
      return true
    })
  }, [activeTab, calls])

  // Pagination calculations
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCalls = filteredCalls.slice(startIndex, endIndex)

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // If user is not authenticated or doesn't have either role, show loading or unauthorized message
  if (!user) {
    return (
      <div className="container py-8 mx-auto flex items-center justify-center h-[80vh]">
        <Loader2 className="w-10 h-10 mr-3 animate-spin" />
        <span className="text-lg">Cargando información de usuario...</span>
      </div>
    )
  }

  if (!isLogistics && !isProduction) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-8 mx-auto"
      >
        <h1 className="text-4xl font-bold tracking-tight text-center">Acceso no autorizado</h1>
        <p className="mt-6 text-lg text-center">
          No tienes permisos para acceder a este módulo. Contacta al administrador.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container px-4 py-6 mx-auto space-y-8 md:px-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Panel de Control</h1>
          <div className="flex flex-col gap-4 mt-3 sm:flex-row sm:items-center">
            <div className="flex items-center">
              Usuario:{" "}
              <Badge variant="outline" className="px-3 py-1 ml-2 font-mono text-base">
                {isProduction ? "PRODUCCION" : "LOGISTICA"}
              </Badge>
            </div>
            <div className="flex items-center text-lg">
              <Calendar className="w-5 h-5 mr-2" />
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={isLogistics ? () => handleCheckExpiredCalls(false) : () => fetchCalls(false)}
                  disabled={checkingExpired || refreshing}
                  className="min-h-[48px] min-w-[48px]"
                >
                  {checkingExpired || refreshing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                      <RotateCw className="w-5 h-5" />
                    </motion.div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isLogistics ? "Verificar llamadas expiradas" : "Actualizar datos"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
          <Card className="bg-blue-50">
            <CardHeader className="pb-4 bg-blue-100">
              <CardTitle className="text-2xl text-blue-800">Llamar a LOGISTICA</CardTitle>
              <CardDescription className="text-lg text-blue-700">
                Selecciona una máquina para crear una llamada a LOGISTICA
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6">
                <div className="flex-1">
                  <Label htmlFor="machineSelect" className="text-lg font-semibold text-blue-800">
                    Seleccionar máquina
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1">
                      <Select value={selectedMachine || ""} onValueChange={handleMachineSelect}>
                        <SelectTrigger
                          id="machineSelect"
                          className="h-12 text-lg bg-white border-blue-300 hover:border-blue-400 focus:border-blue-500"
                        >
                          <SelectValue placeholder="Seleccionar máquina" />
                        </SelectTrigger>
                        <SelectContent className="border-blue-300">
                          {machines && machines.length > 0 ? (
                            machines.map((machine) => (
                              <SelectItem
                                key={machine._id}
                                value={machine._id}
                                className="py-3 text-lg hover:bg-blue-100 focus:bg-blue-100"
                              >
                                {machine.name} {machine.status !== "active" && `(${machine.status})`}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-machines" disabled className="py-3 text-lg">
                              No hay máquinas disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <Label htmlFor="durationDisplay" className="text-lg font-semibold text-blue-800">
                    Duración (minutos)
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <div className="flex items-center flex-1 h-12 px-4 py-3 bg-white border border-blue-300 rounded-md">
                      <Clock className="w-5 h-5 mr-3 text-blue-600" />
                      <span className="text-lg font-medium text-blue-800">{selectedMachineDuration} minutos</span>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleCallLogistics}
                        disabled={!selectedMachine || creatingCall}
                        className="flex items-center h-12 gap-3 px-6 text-lg font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        {creatingCall ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <PhoneCall className="w-5 h-5" />
                        )}
                        Llamar
                      </Button>
                      <Button
                        onClick={handleMoleCall}
                        disabled={!selectedMachine || creatingMoleCall}
                        variant="secondary"
                        className="flex items-center h-12 gap-3 px-6 text-lg font-medium text-white bg-orange-500 hover:bg-orange-600"
                      >
                        {creatingMoleCall ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                        Cambio molde
                      </Button>
                    </div>
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
          <CardHeader className="flex flex-col pb-4 space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <CardTitle className="text-2xl">Registro de Llamadas</CardTitle>
            <div className="flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleExportToExcel}
                        className="flex items-center h-12 gap-2 px-4 text-base"
                      >
                        <Download className="w-5 h-5" />
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
                        size="lg"
                        onClick={handleDeleteAllExceptFirst10}
                        className="flex items-center h-12 gap-2 px-4 text-base"
                      >
                        <Trash2 className="w-5 h-5" />
                        Eliminar excepto 10
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar todas las llamadas excepto las primeras 10</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Filters Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="flex items-center h-12 gap-2 px-4 text-base">
                    <Filter className="w-5 h-5" />
                    Filtros
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-6 w-96">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="filterMachine" className="text-base font-medium">
                        Máquina
                      </Label>
                      <Select
                        value={filters.machineId}
                        onValueChange={(value) => handleFilterChange("machineId", value)}
                      >
                        <SelectTrigger id="filterMachine" className="h-12 text-base">
                          <SelectValue placeholder="Todas las máquinas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="py-3 text-base">
                            Todas las máquinas
                          </SelectItem>
                          {machines.map((machine) => (
                            <SelectItem key={machine._id} value={machine._id} className="py-3 text-base">
                              {machine.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="filterDate" className="text-base font-medium">
                        Fecha
                      </Label>
                      <Input
                        id="filterDate"
                        type="date"
                        value={filters.date}
                        onChange={(e) => handleFilterChange("date", e.target.value)}
                        className="h-12 text-base"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="filterStatus" className="text-base font-medium">
                        Estatus
                      </Label>
                      <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                        <SelectTrigger id="filterStatus" className="h-12 text-base">
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="py-3 text-base">
                            Todos los estados
                          </SelectItem>
                          <SelectItem value="Pendiente" className="py-3 text-base">
                            Pendiente
                          </SelectItem>
                          <SelectItem value="Realizada" className="py-3 text-base">
                            Realizada
                          </SelectItem>
                          <SelectItem value="Expirada" className="py-3 text-base">
                            Expirada
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button onClick={applyFilters} className="w-full h-12 text-base">
                      <Filter className="w-5 h-5 mr-2" />
                      Aplicar Filtros
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full h-12 grid-cols-4">
                <TabsTrigger value="all" className="text-base">
                  Todas
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-base">
                  Pendientes
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-base">
                  Completadas
                </TabsTrigger>
                <TabsTrigger value="expired" className="text-base">
                  Expiradas
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="py-4 text-base font-bold">Nº DE MÁQUINA</TableHead>
                    <TableHead className="py-4 text-base font-bold">FECHA</TableHead>
                    <TableHead className="py-4 text-base font-bold">HORA LLAMADA</TableHead>
                    <TableHead className="py-4 text-base font-bold">DURACIÓN (MIN)</TableHead>
                    <TableHead className="py-4 text-base font-bold">TIEMPO RESTANTE</TableHead>
                    <TableHead className="py-4 text-base font-bold">ESTATUS</TableHead>
                    <TableHead className="py-4 text-base font-bold">ACCIÓN</TableHead>
                    <TableHead className="py-4 text-base font-bold">HORA TAREA TERMINADA</TableHead>
                    <TableHead className="py-4 text-base font-bold">DELETE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                          <span className="text-lg">Cargando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-lg text-center text-muted-foreground">
                        No hay llamadas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {paginatedCalls.map((call) => (
                        <motion.tr
                          key={call._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <TableCell className="py-4 text-base font-medium">
                            <div className="flex flex-col gap-2">
                              <span>{getMachineNames(call)}</span>
                              {call.callType === "mole" && (
                                <Badge
                                  variant="outline"
                                  className="text-sm text-orange-700 bg-orange-100 border-orange-300 w-fit"
                                >
                                  CAMBIO MOLDE
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-base">{new Date(call.date).toLocaleDateString()}</TableCell>
                          <TableCell className="py-4 text-base">
                            {new Date(call.callTime).toLocaleTimeString()}
                          </TableCell>
                          <TableCell className="py-4 text-base font-medium">{call.duration || 90}</TableCell>
                          <TableCell className="py-4">
                            <CallTimer
                              remainingTime={call.remainingTime}
                              status={call.status}
                              duration={call.duration || 90}
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-2">
                              <Badge
                                variant={getStatusBadgeVariant(call.status)}
                                className={`text-sm ${
                                  call.status === "Realizada"
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : call.callType === "mole"
                                      ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                                      : ""
                                }`}
                              >
                                {getStatusIcon(call.status)}
                                {call.status}
                              </Badge>
                              {call.callType === "mole" && (
                                <span className="text-sm font-medium text-orange-600">30min</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {isLogistics && call.status === "Pendiente" && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                {completingCall[call._id] ? (
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                  <Checkbox onCheckedChange={() => handleCompleteCall(call._id)} className="w-6 h-6" />
                                )}
                              </motion.div>
                            )}
                            {call.status === "Realizada" && <Checkbox checked disabled className="w-6 h-6" />}
                            {call.status === "Expirada" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-6 h-6 text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Llamada expirada automáticamente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </TableCell>
                          <TableCell className="py-4 text-base">
                            {call.completionTime ? new Date(call.completionTime).toLocaleTimeString() : "-"}
                          </TableCell>
                          <TableCell className="py-4">
                            <Button
                              variant="ghost"
                              size="lg"
                              onClick={() => handleDeleteCall(call._id)}
                              className="min-h-[44px] min-w-[44px]"
                            >
                              <Trash2 className="w-5 h-5 text-red-500" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                <Pagination>
                  <PaginationContent className="gap-2">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) handlePageChange(currentPage - 1)
                        }}
                        className={`h-12 px-4 text-base ${currentPage === 1 ? "pointer-events-none opacity-50" : ""}`}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(page)
                          }}
                          isActive={currentPage === page}
                          className="h-12 px-4 text-base min-w-[48px]"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) handlePageChange(currentPage + 1)
                        }}
                        className={`h-12 px-4 text-base ${currentPage === totalPages ? "pointer-events-none opacity-50" : ""}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Pagination Info */}
            <div className="flex flex-col gap-4 mt-6 text-base sm:flex-row sm:justify-between sm:items-center text-muted-foreground">
              <span>
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCalls.length)} de {filteredCalls.length}{" "}
                llamadas
              </span>
              <span>
                Página {currentPage} de {totalPages}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default CallDashboard

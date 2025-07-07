"use client"
import { Trash2 } from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { getCalls, createCall, completeCall, checkExpiredCalls, exportCalls, deleteCall } from "@/apis/logistic/callApi"
import { getMachinesByFactory } from "@/apis/gestionStockApi/machineApi"
import { getFactoryById } from "@/apis/factoryApi"
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
  ArrowLeft,
  Building2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Call Dashboard Component - Factory Specific
 *
 * Displays and manages calls for a specific factory
 */
const CallDashboard = () => {
  // Get the current user from auth context
  const { user } = useAuth()
  const { factoryId } = useParams()
  const navigate = useNavigate()

  const [selectedMachine, setSelectedMachine] = useState(null)
  const [selectedMachineDuration, setSelectedMachineDuration] = useState(90)
  const [machines, setMachines] = useState([])
  const [factory, setFactory] = useState(null)
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

  // Add pagination state after existing state declarations
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Pagination state
  const itemsPerPage = 10

  // Check if user has the LOGISTICA role
  const isLogistics = useMemo(() => user?.roles?.includes("LOGISTICA"), [user?.roles])

  // Check if user has the PRODUCCION role
  const isProduction = useMemo(() => user?.roles?.includes("PRODUCCION"), [user?.roles])

  /**
   * Fetches calls from the API with factory filter
   */
  const fetchCalls = useCallback(
    async (silent = false, page = pagination.page) => {
      try {
        if (!silent) setLoading(true)
        setRefreshing(true)

        // Add factory filter to API filters
        const apiFilters = { ...filters }
        if (apiFilters.machineId === "all") delete apiFilters.machineId
        if (apiFilters.status === "all") delete apiFilters.status
        if (!apiFilters.date) delete apiFilters.date

        // Add pagination parameters
        const paginationParams = {
          page: page,
          limit: pagination.limit,
        }

        const response = await getCalls({ ...apiFilters, ...paginationParams })

        if (response && response.data) {
          // Handle paginated response
          const { calls: callsData, pagination: paginationData } = response.data

          // Filter calls by factory (client-side filtering for machines in this factory)
          if (callsData && Array.isArray(callsData)) {
            const factoryMachineIds = machines.map((m) => m._id)
            const factoryCalls = callsData.filter(
              (call) =>
                call.machines && call.machines.some((machine) => factoryMachineIds.includes(machine._id || machine)),
            )

            setCalls(factoryCalls)
            setPagination({
              page: paginationData.page || page,
              limit: paginationData.limit || 10,
              total: paginationData.total || 0,
              totalPages: paginationData.totalPages || 0,
            })
          } else {
            setCalls([])
            setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }))
          }
        } else if (response && Array.isArray(response)) {
          // Handle non-paginated response (fallback)
          const factoryMachineIds = machines.map((m) => m._id)
          const factoryCalls = response.filter(
            (call) =>
              call.machines && call.machines.some((machine) => factoryMachineIds.includes(machine._id || machine)),
          )
          setCalls(factoryCalls)
          setPagination((prev) => ({
            ...prev,
            total: factoryCalls.length,
            totalPages: Math.ceil(factoryCalls.length / prev.limit),
          }))
        } else {
          console.warn("Invalid calls data received:", response)
          if (!silent) {
            toast({
              title: "Advertencia",
              description: "No se pudieron cargar las llamadas correctamente",
              variant: "destructive",
            })
          }
          setCalls([])
          setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }))
        }
      } catch (error) {
        console.error("Error fetching calls:", error)
        if (!silent) {
          setCalls([])
          setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }))
          toast({
            title: "Error",
            description: "Error al cargar las llamadas",
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filters, machines, pagination.page, pagination.limit],
  )

  /**
   * Fetches factory and machines data
   */
  const fetchFactoryData = useCallback(async () => {
    if (!factoryId) return

    try {
      const [factoryData, machinesData] = await Promise.all([
        getFactoryById(factoryId),
        getMachinesByFactory(factoryId),
      ])

      setFactory(factoryData)

      // Only show active machines in the dropdown
      const activeMachines = (machinesData || []).filter((machine) => machine.status === "active")
      setMachines(activeMachines)
    } catch (error) {
      console.error("Error fetching factory data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de la fábrica",
        variant: "destructive",
      })
      navigate("/dashboard")
    }
  }, [factoryId, navigate])

  // Update the remaining time for all calls
  const updateRemainingTime = useCallback(() => {
    setCalls((prevCalls) => {
      if (!prevCalls || prevCalls.length === 0) {
        return prevCalls
      }

      return prevCalls.map((call) => {
        if (call.status === "Pendiente") {
          if (call.remainingTime <= 1) {
            return {
              ...call,
              status: "Expirada",
              remainingTime: 0,
            }
          }

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
   */
  const handleCheckExpiredCalls = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setCheckingExpired(true)

        const response = await checkExpiredCalls()

        if (response) {
          await fetchCalls(true)
        }

        if (!silent) {
          toast({
            title: "Verificación completada",
            description: response.data?.message || "Se han verificado las llamadas expiradas",
            variant: "success",
          })
        }
      } catch (error) {
        console.error("Error checking expired calls:", error)
        if (!silent) {
          toast({
            title: "Error",
            description: "No se pudieron verificar las llamadas expiradas",
            variant: "destructive",
          })
        }
      } finally {
        if (!silent) setCheckingExpired(false)
      }
    },
    [fetchCalls],
  )

  useEffect(() => {
    if (factoryId) {
      fetchFactoryData()
    }
  }, [factoryId, fetchFactoryData])

  useEffect(() => {
    if (machines.length > 0) {
      fetchCalls()

      // Set up interval to update remaining time every second
      const timerInterval = setInterval(() => {
        updateRemainingTime()
      }, 1000)

      // Set up interval to check expired calls and refresh data every 15 seconds
      const refreshInterval = setInterval(() => {
        if (document.visibilityState === "visible") {
          if (isLogistics) {
            handleCheckExpiredCalls(true)
          } else {
            fetchCalls(true)
          }
        }
      }, 15000)

      return () => {
        clearInterval(timerInterval)
        clearInterval(refreshInterval)
      }
    }
  }, [machines, fetchCalls, handleCheckExpiredCalls, isLogistics, updateRemainingTime])

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

      const selectedMachineObj = machines.find((m) => m._id === selectedMachine)

      const callData = {
        machineId: selectedMachine,
        callTime: new Date(),
        date: new Date(),
        status: "Pendiente",
        createdBy: user?.roles?.includes("PRODUCCION") ? "PRODUCCION" : "LOGISTICA",
      }

      console.log("Call data:", callData)
      const response = await createCall(callData)

      let newCall
      if (response && response.data) {
        newCall = response.data
        if (!newCall.remainingTime && newCall.remainingTime !== 0) {
          newCall.remainingTime = (newCall.duration || selectedMachineObj.duration || 90) * 60
        }
      } else {
        newCall = {
          _id: Date.now().toString(),
          ...callData,
          remainingTime: (selectedMachineObj.duration || 90) * 60,
          machines: [{ name: selectedMachineObj?.name || "Máquina seleccionada" }],
        }
      }

      setCalls((prevCalls) => [newCall, ...prevCalls])
      setSelectedMachine(null)
      fetchCalls(true)

      toast({
        title: "Llamada creada",
        description: "Se ha creado una llamada a LOGISTICA exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating call:", error)
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

      const selectedMachineObj = machines.find((m) => m._id === selectedMachine)

      const callData = {
        machineId: selectedMachine,
        callTime: new Date(),
        date: new Date(),
        status: "Pendiente",
        createdBy: user?.roles?.includes("PRODUCCION") ? "PRODUCCION" : "LOGISTICA",
        duration: 30,
        callType: "mole",
      }

      console.log("Mole call data:", callData)
      const response = await createCall(callData)

      let newCall
      if (response && response.data) {
        newCall = response.data
        if (!newCall.remainingTime && newCall.remainingTime !== 0) {
          newCall.remainingTime = 30 * 60
        }
      } else {
        newCall = {
          _id: Date.now().toString(),
          ...callData,
          remainingTime: 30 * 60,
          machines: [{ name: selectedMachineObj?.name || "Máquina seleccionada" }],
        }
      }

      setCalls((prevCalls) => [newCall, ...prevCalls])
      setSelectedMachine(null)
      fetchCalls(true)

      toast({
        title: "Llamada Cambio molde creada",
        description: "Se ha creado una llamada de Cambio molde (30 min) a LOGISTICA exitosamente",
        variant: "success",
      })
    } catch (error) {
      console.error("Error creating mole call:", error)
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
   */
  const handleMachineSelect = useCallback(
    (machineId) => {
      console.log("Machine selected:", machineId)
      setSelectedMachine(machineId)

      const selectedMachineObj = machines.find((m) => m._id === machineId)
      if (selectedMachineObj) {
        setSelectedMachineDuration(selectedMachineObj.duration || 90)
      }
    },
    [machines],
  )

  /**
   * Handles marking a call as completed
   */
  const handleCompleteCall = useCallback(
    async (id) => {
      try {
        setCompletingCall((prev) => ({ ...prev, [id]: true }))

        const completionTime = new Date()
        const userRole = user?.roles?.includes("LOGISTICA") ? "LOGISTICA" : "PRODUCCION"

        await completeCall(id, userRole)

        setCalls((prevCalls) =>
          prevCalls.map((call) =>
            call._id === id
              ? {
                  ...call,
                  status: "Realizada",
                  completionTime: completionTime,
                  remainingTime: 0,
                }
              : call,
          ),
        )

        toast({
          title: "Llamada completada",
          description: "La llamada ha sido marcada como completada",
          variant: "success",
        })
      } catch (error) {
        console.error("Error completing call:", error)
        const errorMessage = error.response?.data?.message || "No se pudo completar la llamada"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        fetchCalls(true)
      } finally {
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
    const apiFilters = { ...filters }
    if (apiFilters.machineId === "all") delete apiFilters.machineId
    if (apiFilters.status === "all") delete apiFilters.status
    if (!apiFilters.date) delete apiFilters.date

    exportCalls(apiFilters)
  }, [filters])

  /**
   * Handles changing a filter value
   */
  const handleFilterChange = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }, [])

  /**
   * Handles applying filters to the calls list
   */
  const applyFilters = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
    fetchCalls(false, 1)
  }, [fetchCalls])

  /**
   * Handles deleting a call
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
        fetchCalls()
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
      const callsToDelete = calls.slice(10)

      toast({
        title: "Eliminando llamadas",
        description: `Eliminando ${callsToDelete.length} llamadas...`,
        variant: "default",
      })

      let deletedCount = 0
      for (const call of callsToDelete) {
        try {
          await deleteCall(call._id)
          deletedCount++
        } catch (error) {
          console.error(`Error al eliminar la llamada ${call._id}:`, error)
        }
      }

      toast({
        title: "Llamadas eliminadas",
        description: `Se han eliminado ${deletedCount} llamadas correctamente`,
        variant: "success",
      })

      fetchCalls()
    } catch (error) {
      console.error("Error al eliminar las llamadas:", error)
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

  // Remove these lines:
  // const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
  // const startIndex = (currentPage - 1) * itemsPerPage
  // const endIndex = startIndex + itemsPerPage
  // const paginatedCalls = filteredCalls.slice(startIndex, endIndex)

  // Replace with:
  const paginatedCalls = filteredCalls // Server already returns paginated data
  const totalPages = pagination.totalPages
  const startIndex = (pagination.page - 1) * pagination.limit
  const endIndex = Math.min(startIndex + pagination.limit, pagination.total)

  // Handle page change
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }))
    fetchCalls(false, page)
  }

  // Handle back navigation
  const handleBackToFactories = () => {
    if (factory?.categoryId) {
      navigate(`/factories/${factory.categoryId._id || factory.categoryId}`)
    } else {
      navigate("/dashboard")
    }
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
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToFactories}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Fábricas
            </Button>
          </div>
          <h1 className="flex items-center gap-2 text-4xl font-bold tracking-tight">
            <Building2 className="w-8 h-8 text-primary" />
            {factory?.name || "Fábrica"}
          </h1>
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
            {factory?.categoryId && (
              <div className="flex items-center text-lg">
                <span className="text-muted-foreground">Categoría: </span>
                <Badge variant="secondary" className="ml-2">
                  {factory.categoryId.name}
                </Badge>
              </div>
            )}
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
                Selecciona una máquina de esta fábrica para crear una llamada a LOGISTICA
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
                              No hay máquinas disponibles en esta fábrica
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
            <CardTitle className="text-2xl">Registro de Llamadas - {factory?.name}</CardTitle>
            <div className="flex flex-wrap gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleExportToExcel}
                        className="flex items-center h-12 gap-2 px-4 text-base bg-transparent"
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
                        className="flex items-center h-12 gap-2 px-4 text-base bg-transparent"
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
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center h-12 gap-2 px-4 text-base bg-transparent"
                  >
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
                        No hay llamadas registradas para esta fábrica
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
                          if (pagination.page > 1) handlePageChange(pagination.page - 1)
                        }}
                        className={`h-12 px-4 text-base ${pagination.page === 1 ? "pointer-events-none opacity-50" : ""}`}
                      />
                    </PaginationItem>

                    {/* Show first page if we're not near the beginning */}
                    {pagination.page > 3 && (
                      <>
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(1)
                            }}
                            className="h-12 px-4 text-base min-w-[48px]"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                        {pagination.page > 4 && (
                          <PaginationItem>
                            <span className="flex items-center h-12 px-2 text-base">...</span>
                          </PaginationItem>
                        )}
                      </>
                    )}

                    {/* Show previous page */}
                    {pagination.page > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(pagination.page - 1)
                          }}
                          className="h-12 px-4 text-base min-w-[48px]"
                        >
                          {pagination.page - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        isActive={true}
                        className="h-12 px-4 text-base min-w-[48px]"
                      >
                        {pagination.page}
                      </PaginationLink>
                    </PaginationItem>

                    {/* Show next page */}
                    {pagination.page < totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(pagination.page + 1)
                          }}
                          className="h-12 px-4 text-base min-w-[48px]"
                        >
                          {pagination.page + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Show last page if we're not near the end */}
                    {pagination.page < totalPages - 2 && (
                      <>
                        {pagination.page < totalPages - 3 && (
                          <PaginationItem>
                            <span className="flex items-center h-12 px-2 text-base">...</span>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(totalPages)
                            }}
                            className="h-12 px-4 text-base min-w-[48px]"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (pagination.page < totalPages) handlePageChange(pagination.page + 1)
                        }}
                        className={`h-12 px-4 text-base ${pagination.page === totalPages ? "pointer-events-none opacity-50" : ""}`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Pagination Info */}
            <div className="flex flex-col gap-4 mt-6 text-base sm:flex-row sm:justify-between sm:items-center text-muted-foreground">
              <span>
                Mostrando {startIndex + 1} a {endIndex} de {pagination.total} llamadas
              </span>
              <span>
                Página {pagination.page} de {pagination.totalPages}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default CallDashboard

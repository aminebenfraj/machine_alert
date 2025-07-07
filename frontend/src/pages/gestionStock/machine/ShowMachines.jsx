"use client"

import { useState, useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllMachines, getMachinesByFactory, getMachinesByCategory } from "@/apis/gestionStockApi/machineApi"
import { getAllFactories } from "@/apis/factoryApi"
import { getAllCategories } from "@/apis/categoryApi"
import { deleteMachine } from "@/apis/gestionStockApi/machineApi"
import { Plus, Edit, Trash2, Clock, Building2, Factory, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

const ShowMachines = () => {
  const [machines, setMachines] = useState([])
  const [factories, setFactories] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedFactory, setSelectedFactory] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { factoryId } = useParams() // If coming from a specific factory

  // Check if user has Admin role
  const canManageMachines = user?.roles?.some((role) => ["Admin", "PRODUCCION"].includes(role))

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (factoryId) {
      setSelectedFactory(factoryId)
      fetchMachinesByFactory(factoryId)
    } else {
      fetchMachines()
    }
  }, [selectedFactory, selectedCategory, factoryId])

  const fetchInitialData = async () => {
    try {
      const [factoriesData, categoriesData] = await Promise.all([getAllFactories(), getAllCategories()])
      setFactories(factoriesData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive",
      })
    }
  }

  const fetchMachines = async () => {
    try {
      setLoading(true)
      let data

      if (selectedFactory !== "all") {
        data = await getMachinesByFactory(selectedFactory)
      } else if (selectedCategory !== "all") {
        data = await getMachinesByCategory(selectedCategory)
      } else {
        data = await getAllMachines()
      }

      setMachines(data || [])
    } catch (error) {
      console.error("Failed to fetch machines:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las máquinas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMachinesByFactory = async (factoryId) => {
    try {
      setLoading(true)
      const data = await getMachinesByFactory(factoryId)
      setMachines(data || [])
    } catch (error) {
      console.error("Failed to fetch machines by factory:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las máquinas de la fábrica",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta máquina?")) {
      try {
        await deleteMachine(id)
        fetchMachines()
        toast({
          title: "Éxito",
          description: "Máquina eliminada correctamente",
          variant: "success",
        })
      } catch (error) {
        console.error("Failed to delete machine:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la máquina",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-red-500"
      case "maintenance":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Activa"
      case "inactive":
        return "Inactiva"
      case "maintenance":
        return "Mantenimiento"
      default:
        return status
    }
  }

  return (
    <div className="container p-4 mx-auto">
      <Card className="bg-white shadow-lg dark:bg-zinc-800">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              <Factory className="w-6 h-6" />
              Máquinas
            </CardTitle>
            {factoryId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-1 mt-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por fábrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fábricas</SelectItem>
                  {factories.map((factory) => (
                    <SelectItem key={factory._id} value={factory._id}>
                      {factory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canManageMachines && (
              <Link to="/machines/create">
                <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Máquina
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg">Cargando máquinas...</div>
            </div>
          ) : machines.length === 0 ? (
            <div className="py-12 text-center">
              <Factory className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No hay máquinas disponibles</h3>
              <p className="text-muted-foreground">
                {selectedFactory !== "all" || selectedCategory !== "all"
                  ? "No se encontraron máquinas con los filtros seleccionados"
                  : "Crea una máquina para comenzar"}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {machines.map((machine) => (
                <motion.div
                  key={machine._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="transition-shadow bg-gray-50 dark:bg-zinc-700 hover:shadow-md">
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{machine.name}</h3>
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">{machine.description}</p>

                      {/* Factory and Category Info */}
                      {machine.factoryId && (
                        <div className="mb-2 space-y-1">
                          <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-300">
                            <Building2 className="w-4 h-4 mr-1 text-blue-500" />
                            <span>Fábrica: {machine.factoryId.name}</span>
                          </div>
                          {machine.factoryId.categoryId && (
                            <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-300">
                              <Factory className="w-4 h-4 mr-1 text-green-500" />
                              <span>Categoría: {machine.factoryId.categoryId.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 mr-1 text-blue-500" />
                        <span className="text-sm text-zinc-600 dark:text-zinc-300">
                          Duración: {machine.duration || 90} minutos
                        </span>
                      </div>

                      <Badge className={`mb-4 ${getStatusColor(machine.status)} text-white`}>
                        {getStatusText(machine.status)}
                      </Badge>

                      {canManageMachines && (
                        <div className="flex justify-end space-x-2">
                          <Link to={`/machines/edit/${machine._id}`}>
                            <Button
                              variant="outline"
                              className="text-blue-600 bg-transparent hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            className="text-red-600 bg-transparent hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            onClick={() => handleDelete(machine._id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ShowMachines

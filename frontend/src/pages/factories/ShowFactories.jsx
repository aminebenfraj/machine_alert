"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllFactories, deleteFactory } from "@/apis/factoryApi"
import { getAllCategories } from "@/apis/categoryApi"
import { Plus, Edit, Trash2, Building2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

const ShowFactories = () => {
  const [factories, setFactories] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Check if user has management privileges
  const canManageFactories = user?.roles?.some((role) => ["Admin", "PRODUCCION"].includes(role))

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchFactories()
  }, [selectedCategory])

  const fetchInitialData = async () => {
    try {
      const categoriesData = await getAllCategories()
      setCategories(categoriesData || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchFactories = async () => {
    try {
      setLoading(true)
      const categoryFilter = selectedCategory !== "all" ? selectedCategory : null
      const data = await getAllFactories(categoryFilter)
      setFactories(data || [])
    } catch (error) {
      console.error("Failed to fetch factories:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las fábricas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta fábrica?")) {
      try {
        await deleteFactory(id)
        fetchFactories()
        toast({
          title: "Éxito",
          description: "Fábrica eliminada correctamente",
          variant: "success",
        })
      } catch (error) {
        console.error("Failed to delete factory:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la fábrica. Puede tener máquinas asociadas.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="container p-4 mx-auto">
      <Card className="bg-white shadow-lg dark:bg-zinc-800">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al Panel
                </Button>
              </Link>
            </div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              <Building2 className="w-6 h-6" />
              Gestión de Fábricas
            </CardTitle>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Category Filter */}
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

            {canManageFactories && (
              <Link to="/factories/create">
                <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Fábrica
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg">Cargando fábricas...</div>
            </div>
          ) : factories.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No hay fábricas disponibles</h3>
              <p className="text-muted-foreground">
                {selectedCategory !== "all"
                  ? "No se encontraron fábricas en la categoría seleccionada"
                  : "Crea una fábrica para comenzar"}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {factories.map((factory) => (
                <motion.div
                  key={factory._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="transition-shadow bg-gray-50 dark:bg-zinc-700 hover:shadow-md">
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{factory.name}</h3>
                      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {factory.description || "Sin descripción"}
                      </p>

                      {/* Category Info */}
                      {factory.categoryId && (
                        <div className="mb-2">
                          <Badge variant="secondary" className="text-sm">
                            {factory.categoryId.name}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="text-sm">
                          Fábrica
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(factory.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {canManageFactories && (
                        <div className="flex justify-end space-x-2">
                          <Link to={`/factories/edit/${factory._id}`}>
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
                            onClick={() => handleDelete(factory._id)}
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

export default ShowFactories

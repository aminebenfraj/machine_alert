"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAllCategories, deleteCategory } from "@/apis/categoryApi"
import { Plus, Edit, Trash2, Factory, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { toast } from "@/hooks/use-toast"

const ShowCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Check if user has management privileges
  const canManageCategories = user?.roles?.some((role) => ["Admin", "PRODUCCION"].includes(role))

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await getAllCategories()
      setCategories(data || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      try {
        await deleteCategory(id)
        fetchCategories()
        toast({
          title: "Éxito",
          description: "Categoría eliminada correctamente",
          variant: "success",
        })
      } catch (error) {
        console.error("Failed to delete category:", error)
        toast({
          title: "Error",
          description: "No se pudo eliminar la categoría. Puede tener fábricas asociadas.",
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
              <Factory className="w-6 h-6" />
              Gestión de Categorías
            </CardTitle>
          </div>
          {canManageCategories && (
            <Link to="/categories/create">
              <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg">Cargando categorías...</div>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <Factory className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No hay categorías disponibles</h3>
              <p className="text-muted-foreground">Crea una categoría para comenzar a organizar tus fábricas</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {categories.map((category) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="transition-shadow bg-gray-50 dark:bg-zinc-700 hover:shadow-md">
                    <CardContent className="p-4">
                      <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{category.name}</h3>
                      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
                        {category.description || "Sin descripción"}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className="text-sm">
                          Categoría
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {canManageCategories && (
                        <div className="flex justify-end space-x-2">
                          <Link to={`/categories/edit/${category._id}`}>
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
                            onClick={() => handleDelete(category._id)}
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

export default ShowCategories

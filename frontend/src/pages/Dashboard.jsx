"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllCategories } from "@/apis/categoryApi"
import { useAuth } from "@/context/AuthContext"
import { Factory, ArrowRight, Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const Dashboard = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if user has admin privileges
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

  const handleCategoryClick = (categoryId) => {
    navigate(`/factories/${categoryId}`)
  }

  if (loading) {
    return (
      <div className="container py-8 mx-auto flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 mr-3 animate-spin" />
        <span className="text-lg">Cargando categorías...</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container px-4 py-6 mx-auto space-y-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Panel Principal</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Selecciona una categoría para ver las fábricas y gestionar las llamadas
          </p>
        </div>

        {canManageCategories && (
          <Button onClick={() => navigate("/categories/create")} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Categoría
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Factory className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No hay categorías disponibles</h3>
            <p className="mb-4 text-muted-foreground">
              Crea una categoría para comenzar a organizar tus fábricas y máquinas
            </p>
            {canManageCategories && (
              <Button onClick={() => navigate("/categories/create")}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Categoría
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {categories.map((category) => (
            <motion.div
              key={category._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="transition-all duration-200 border-2 cursor-pointer hover:shadow-lg hover:border-primary/20"
                onClick={() => handleCategoryClick(category._id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <Factory className="w-6 h-6 text-primary" />
                      {category.name}
                    </CardTitle>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">{category.description || "Sin descripción"}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">
                      Categoría
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Creado: {new Date(category.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

export default Dashboard

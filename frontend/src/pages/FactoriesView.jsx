"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getFactoriesByCategory } from "@/apis/factoryApi"
import { getCategoryById } from "@/apis/categoryApi"
import { useAuth } from "@/context/AuthContext"
import { ArrowLeft, ArrowRight, Building2, Plus, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const FactoriesView = () => {
  const [factories, setFactories] = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(true)
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Check if user has admin privileges
  const canManageFactories = user?.roles?.some((role) => ["Admin", "PRODUCCION"].includes(role))

  useEffect(() => {
    if (categoryId) {
      fetchCategoryAndFactories()
    }
  }, [categoryId])

  const fetchCategoryAndFactories = async () => {
    try {
      setLoading(true)
      const [categoryData, factoriesData] = await Promise.all([
        getCategoryById(categoryId),
        getFactoriesByCategory(categoryId),
      ])

      setCategory(categoryData)
      setFactories(factoriesData || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFactoryClick = (factoryId) => {
    navigate(`/calls/${factoryId}`)
  }

  const handleBackToDashboard = () => {
    navigate("/dashboard")
  }

  if (loading) {
    return (
      <div className="container py-8 mx-auto flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 mr-3 animate-spin" />
        <span className="text-lg">Cargando fábricas...</span>
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
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDashboard}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Panel
            </Button>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Fábricas - {category?.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {category?.description || "Selecciona una fábrica para gestionar las llamadas"}
          </p>
        </div>

        {canManageFactories && (
          <Button onClick={() => navigate(`/factories/create/${categoryId}`)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Fábrica
          </Button>
        )}
      </div>

      {factories.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No hay fábricas en esta categoría</h3>
            <p className="mb-4 text-muted-foreground">Crea una fábrica para comenzar a gestionar máquinas y llamadas</p>
            {canManageFactories && (
              <Button onClick={() => navigate(`/factories/create/${categoryId}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Fábrica
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
          {factories.map((factory) => (
            <motion.div
              key={factory._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="transition-all duration-200 border-2 cursor-pointer hover:shadow-lg hover:border-primary/20"
                onClick={() => handleFactoryClick(factory._id)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <Building2 className="w-6 h-6 text-primary" />
                      {factory.name}
                    </CardTitle>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-muted-foreground">{factory.description || "Sin descripción"}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm">
                      Fábrica
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Creado: {new Date(factory.createdAt).toLocaleDateString()}
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

export default FactoriesView

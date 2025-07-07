"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createMachine } from "@/apis/gestionStockApi/machineApi"
import { getAllFactories } from "@/apis/factoryApi"
import { getAllCategories } from "@/apis/categoryApi"
import { Sparkles, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const CreateMachine = () => {
  const navigate = useNavigate()
  const [machine, setMachine] = useState({
    name: "",
    description: "",
    status: "active",
    duration: 90,
    factoryId: "",
  })
  const [factories, setFactories] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchFactoriesByCategory()
    } else {
      fetchAllFactories()
    }
  }, [selectedCategory])

  const fetchInitialData = async () => {
    try {
      const categoriesData = await getAllCategories()
      setCategories(categoriesData || [])
      await fetchAllFactories()
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos iniciales",
        variant: "destructive",
      })
    }
  }

  const fetchAllFactories = async () => {
    try {
      const factoriesData = await getAllFactories()
      setFactories(factoriesData || [])
    } catch (error) {
      console.error("Failed to fetch factories:", error)
    }
  }

  const fetchFactoriesByCategory = async () => {
    try {
      const factoriesData = await getAllFactories(selectedCategory)
      setFactories(factoriesData || [])
      // Reset factory selection when category changes
      setMachine((prev) => ({ ...prev, factoryId: "" }))
    } catch (error) {
      console.error("Failed to fetch factories by category:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setMachine((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!machine.factoryId) {
      toast({
        title: "Error",
        description: "Por favor selecciona una fábrica",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createMachine(machine)
      toast({
        title: "Éxito",
        description: "Máquina creada correctamente",
        variant: "success",
      })
      navigate("/machines")
    } catch (error) {
      console.error("Failed to create machine:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la máquina",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
      <Card className="w-full max-w-md bg-white shadow-lg dark:bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Crear Nueva Máquina</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre de la Máquina
              </label>
              <Input
                id="name"
                name="name"
                value={machine.name}
                onChange={handleChange}
                required
                className="w-full"
                placeholder="Ingresa el nombre de la máquina"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descripción
              </label>
              <Textarea
                id="description"
                name="description"
                value={machine.description}
                onChange={handleChange}
                className="w-full"
                placeholder="Ingresa la descripción de la máquina"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Categoría (Filtro)
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría para filtrar fábricas" />
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
            </div>

            <div className="space-y-2">
              <label htmlFor="factoryId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Fábrica *
              </label>
              <Select
                name="factoryId"
                value={machine.factoryId}
                onValueChange={(value) => handleChange({ target: { name: "factoryId", value } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar fábrica" />
                </SelectTrigger>
                <SelectContent>
                  {factories.map((factory) => (
                    <SelectItem key={factory._id} value={factory._id}>
                      {factory.name}
                      {factory.categoryId && (
                        <span className="ml-2 text-sm text-muted-foreground">({factory.categoryId.name})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Duración (minutos)
              </label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={machine.duration}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "duration",
                      value: Number.parseInt(e.target.value) || 90,
                    },
                  })
                }
                required
                className="w-full"
                placeholder="Ingresa la duración por defecto en minutos"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Estado
              </label>
              <Select
                name="status"
                value={machine.status}
                onValueChange={(value) => handleChange({ target: { name: "status", value } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="inactive">Inactiva</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="button" variant="outline" onClick={() => navigate("/machines")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Creando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Crear Máquina
                  </>
                )}
              </Button>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default CreateMachine

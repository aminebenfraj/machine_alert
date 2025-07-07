"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createFactory } from "@/apis/factoryApi"
import { getAllCategories } from "@/apis/categoryApi"
import { Sparkles, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const CreateFactory = () => {
  const navigate = useNavigate()
  const { categoryId } = useParams() // Optional: if coming from a specific category
  const [factory, setFactory] = useState({
    name: "",
    description: "",
    categoryId: categoryId || "",
  })
  const [categories, setCategories] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories()
      setCategories(data || [])
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las categorías",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFactory((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!factory.categoryId) {
      toast({
        title: "Error",
        description: "Por favor selecciona una categoría",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      await createFactory(factory)
      toast({
        title: "Éxito",
        description: "Fábrica creada correctamente",
        variant: "success",
      })
      navigate("/factories")
    } catch (error) {
      console.error("Failed to create factory:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la fábrica",
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
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Crear Nueva Fábrica</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre de la Fábrica
              </label>
              <Input
                id="name"
                name="name"
                value={factory.name}
                onChange={handleChange}
                required
                className="w-full"
                placeholder="Ingresa el nombre de la fábrica"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descripción
              </label>
              <Textarea
                id="description"
                name="description"
                value={factory.description}
                onChange={handleChange}
                className="w-full"
                placeholder="Ingresa la descripción de la fábrica"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="categoryId" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Categoría *
              </label>
              <Select
                name="categoryId"
                value={factory.categoryId}
                onValueChange={(value) => handleChange({ target: { name: "categoryId", value } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="button" variant="outline" onClick={() => navigate("/factories")}>
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
                    Crear Fábrica
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

export default CreateFactory

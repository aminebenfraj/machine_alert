"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategoryById, updateCategory } from "@/apis/categoryApi"
import { Save, ArrowLeft } from "lucide-react"
import { toast } from "@/hooks/use-toast"

const EditCategory = () => {
  const [category, setCategory] = useState({
    name: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      fetchCategory()
    }
  }, [id])

  const fetchCategory = async () => {
    try {
      const data = await getCategoryById(id)
      setCategory({
        name: data.name || "",
        description: data.description || "",
      })
    } catch (error) {
      console.error("Failed to fetch category:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la categoría",
        variant: "destructive",
      })
      navigate("/categories")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setCategory((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateCategory(id, category)
      toast({
        title: "Éxito",
        description: "Categoría actualizada correctamente",
        variant: "success",
      })
      navigate("/categories")
    } catch (error) {
      console.error("Failed to update category:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
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
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Editar Categoría</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nombre de la Categoría
              </label>
              <Input
                id="name"
                name="name"
                value={category.name}
                onChange={handleChange}
                required
                className="w-full"
                placeholder="Ingresa el nombre de la categoría"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Descripción
              </label>
              <Textarea
                id="description"
                name="description"
                value={category.description}
                onChange={handleChange}
                className="w-full"
                placeholder="Ingresa la descripción de la categoría"
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="button" variant="outline" onClick={() => navigate("/categories")}>
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
                    <span className="mr-2">Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Actualizar Categoría
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

export default EditCategory

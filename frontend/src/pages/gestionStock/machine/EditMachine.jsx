"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { getMachineById, updateMachine } from "../../../apis/gestionStockApi/machineApi"
import { Save, ArrowLeft } from "lucide-react"

const EditMachine = () => {
  const [machine, setMachine] = useState({
    name: "",
    description: "",
    status: "active",
  })
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      fetchMachine()
    }
  }, [id])

  const fetchMachine = async () => {
    try {
      const data = await getMachineById(id)
      setMachine(data)
    } catch (error) {
      console.error("Failed to fetch machine:", error)
      alert("Failed to fetch machine. Redirecting to machines list.")
      navigate("/machines")
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setMachine((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateMachine(id, machine)
      alert("Machine updated successfully!")
      navigate("/machines")
    } catch (error) {
      console.error("Failed to update machine:", error)
      alert("Failed to update machine. Please try again.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
      <Card className="w-full max-w-md bg-white shadow-lg dark:bg-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Edit Machine</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Machine Name
              </label>
              <Input
                id="name"
                name="name"
                value={machine.name}
                onChange={handleChange}
                required
                className="w-full"
                placeholder="Enter machine name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={machine.description}
                onChange={handleChange}
                className="w-full"
                placeholder="Enter machine description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Status
              </label>
              <Select
                name="status"
                value={machine.status}
                onValueChange={(value) => handleChange({ target: { name: "status", value } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button type="button" variant="outline" onClick={() => navigate("/machines")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                type="submit"
                className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <Save className="w-4 h-4 mr-2" />
                Update Machine
              </Button>
            </motion.div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default EditMachine

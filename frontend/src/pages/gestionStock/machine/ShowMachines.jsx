"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { getAllMachines, deleteMachine } from "../../../apis/gestionStockApi/machineApi"
import { Plus, Edit, Trash2 } from "lucide-react"

const ShowMachines = () => {
  const [machines, setMachines] = useState([])

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    try {
      const data = await getAllMachines()
      setMachines(data)
    } catch (error) {
      console.error("Failed to fetch machines:", error)
      alert("Failed to fetch machines. Please try again.")
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this machine?")) {
      try {
        await deleteMachine(id)
        fetchMachines()
        alert("Machine deleted successfully!")
      } catch (error) {
        console.error("Failed to delete machine:", error)
        alert("Failed to delete machine. Please try again.")
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

  return (
    <div className="container p-4 mx-auto">
      <Card className="bg-white shadow-lg dark:bg-zinc-800">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Machines</CardTitle>
          <Link to="/machines/create">
            <Button className="text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
              <Plus className="w-4 h-4 mr-2" />
              Add New Machine
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
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
                    <Badge className={`mb-4 ${getStatusColor(machine.status)}`}>{machine.status}</Badge>
                    <div className="flex justify-end space-x-2">
                      <Link to={`/machines/edit/${machine._id}`}>
                        <Button
                          variant="outline"
                          className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(machine._id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ShowMachines

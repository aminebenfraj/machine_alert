import { apiRequest } from "../api"

const BASE_URL = "api/machines"

// Get all machines
export const getAllMachines = (factoryId = null, categoryId = null) => {
  const params = {}
  if (factoryId) params.factoryId = factoryId
  if (categoryId) params.categoryId = categoryId
  return apiRequest("GET", BASE_URL, null, false, params)
}

// Get a single machine by ID
export const getMachineById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Get machines by factory
export const getMachinesByFactory = (factoryId) => {
  return apiRequest("GET", `${BASE_URL}/factory/${factoryId}`)
}

// Get machines by category
export const getMachinesByCategory = (categoryId) => {
  return apiRequest("GET", `${BASE_URL}/category/${categoryId}`)
}

// Create a new machine
export const createMachine = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing machine
export const updateMachine = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a machine
export const deleteMachine = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

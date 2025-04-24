import { apiRequest } from "../api"

const BASE_URL = "api/machines"

// Get all machines
export const getAllMachines = () => {
  return apiRequest("GET", BASE_URL)
}

// Get a single machine by ID
export const getMachineById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
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


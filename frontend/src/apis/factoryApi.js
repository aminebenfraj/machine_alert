import { apiRequest } from "./api"

const BASE_URL = "api/factories"

// Get all factories
export const getAllFactories = (categoryId = null) => {
  const params = categoryId ? { categoryId } : {}
  return apiRequest("GET", BASE_URL, null, false, params)
}

// Get a single factory by ID
export const getFactoryById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Get factories by category
export const getFactoriesByCategory = (categoryId) => {
  return apiRequest("GET", `${BASE_URL}/category/${categoryId}`)
}

// Create a new factory
export const createFactory = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing factory
export const updateFactory = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a factory
export const deleteFactory = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

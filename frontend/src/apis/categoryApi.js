import { apiRequest } from "./api"

const BASE_URL = "api/categories"

// Get all categories
export const getAllCategories = () => {
  return apiRequest("GET", BASE_URL)
}

// Get a single category by ID
export const getCategoryById = (id) => {
  return apiRequest("GET", `${BASE_URL}/${id}`)
}

// Create a new category
export const createCategory = (data) => {
  return apiRequest("POST", BASE_URL, data)
}

// Update an existing category
export const updateCategory = (id, data) => {
  return apiRequest("PUT", `${BASE_URL}/${id}`, data)
}

// Delete a category
export const deleteCategory = (id) => {
  return apiRequest("DELETE", `${BASE_URL}/${id}`)
}

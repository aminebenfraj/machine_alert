import axios from "axios"

// Create a configurable axios instance
const axiosInstance = axios.create({
  baseURL: "https://machine-alert.onrender.com/",
  timeout: 15000, // Increased timeout for reliability
  withCredentials: true, // Important: This enables cookies to be sent with requests
})

// Add response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If the error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && error.response?.data?.code === "TOKEN_EXPIRED") {
      originalRequest._retry = true

      try {
        // Attempt to refresh the token (you'll need to implement this endpoint)
        // const refreshResponse = await axiosInstance.post("/api/auth/refresh-token");
        // const newToken = refreshResponse.data.token;

        // For now, we'll just redirect to login if token is expired
        localStorage.removeItem("accessToken")
        window.location.href = "/login"
        return Promise.reject(error)
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("accessToken")
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// Enhanced API request function with retry mechanism
export const apiRequest = async (method, url, data = null, isFormData = false, queryParams = {}) => {
  // Maximum number of retries
  const MAX_RETRIES = 2
  let retries = 0
  let lastError = null

  // Build query string for GET requests
  const queryString = Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ""

  // Append query string to URL for GET requests
  const requestUrl = method.toUpperCase() === "GET" && queryString ? `${url}${queryString}` : url

  while (retries <= MAX_RETRIES) {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("accessToken")

      const config = {
        method,
        url: requestUrl,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
        },
        ...(method.toUpperCase() !== "GET" && data ? { data } : {}),
        ...(method.toUpperCase() === "GET" && Object.keys(queryParams).length > 0 ? { params: queryParams } : {}),
      }

      const response = await axiosInstance(config)
      return response.data
    } catch (error) {
      lastError = error

      // Check if we should retry based on error type
      const shouldRetry =
        // Network errors
        error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK" ||
        // Server errors (5xx)
        (error.response && error.response.status >= 500) ||
        // Rate limiting
        (error.response && error.response.status === 429)

      if (shouldRetry && retries < MAX_RETRIES) {
        // Exponential backoff: 300ms, 900ms, 2700ms, etc.
        const delay = 300 * Math.pow(3, retries)
        console.warn(`API request failed, retrying (${retries + 1}/${MAX_RETRIES}) in ${delay}ms...`, error)
        await new Promise((resolve) => setTimeout(resolve, delay))
        retries++
      } else {
        // Enhanced error logging
        console.error("API Request Error:", {
          url: requestUrl,
          method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        })

        // Format error for better handling
        const formattedError = {
          status: error.response?.status,
          message: error.response?.data?.error || error.message || "Unknown error occurred",
          code: error.response?.data?.code || "UNKNOWN_ERROR",
          requestId: error.response?.data?.requestId,
          originalError: error,
        }

        throw formattedError
      }
    }
  }

  // If we've exhausted all retries
  throw lastError
}

export default axiosInstance

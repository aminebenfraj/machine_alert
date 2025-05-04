"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axiosInstance, { apiRequest } from "../apis/api"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const navigate = useNavigate()

  // Load user data on initial mount with improved error handling
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("accessToken")

        if (!token) {
          setLoading(false)
          return
        }

        // Set token for all requests
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Fetch current user profile with retry mechanism
        const userData = await apiRequest("GET", "api/users/profile")

        if (userData) {
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error loading user:", error)

        // Handle specific error codes
        if (error.code === "TOKEN_EXPIRED" || error.code === "INVALID_TOKEN") {
          // Token is invalid or expired, clear it
          localStorage.removeItem("accessToken")
          setAuthError("Your session has expired. Please log in again.")
        } else if (error.code === "USER_NOT_FOUND") {
          // User was deleted or doesn't exist
          localStorage.removeItem("accessToken")
          setAuthError("User account not found. Please contact support.")
        } else {
          // Generic error handling
          localStorage.removeItem("accessToken")
          setAuthError("Authentication error. Please log in again.")
        }

        localStorage.removeItem("user")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Register function with improved error handling
  const register = async (license, username, email, password) => {
    try {
      const response = await apiRequest("POST", "api/auth/register", {
        license,
        username,
        email,
        password,
      })

      return {
        success: true,
        data: response,
      }
    } catch (error) {
      console.error("Registration error:", error)

      // Handle specific error codes
      let errorMessage = "Registration failed. Please try again."

      if (error.code === "DUPLICATE_LICENSE") {
        errorMessage = "A user with this license already exists."
      } else if (error.code === "DUPLICATE_EMAIL") {
        errorMessage = "A user with this email already exists."
      } else if (error.code === "DUPLICATE_USERNAME") {
        errorMessage = "This username is already taken."
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        message: errorMessage,
        code: error.code,
      }
    }
  }

  // Optimized login function with retry and better error handling
  const login = async (license, password) => {
    setAuthError(null)

    try {
      const userData = await apiRequest("POST", "api/auth/login", {
        license,
        password,
      })

      // Extract token and user data
      const { token, ...userInfo } = userData

      if (!token) {
        throw new Error("No token received from server")
      }

      // Store token in localStorage
      localStorage.setItem("accessToken", token)

      // Set default auth header
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Store user data
      setUser(userInfo)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(userInfo))

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)

      // Handle specific error codes
      let errorMessage = "Login failed. Please check your credentials."

      if (error.code === "INVALID_CREDENTIALS") {
        errorMessage = "Invalid license or password."
      } else if (error.code === "USER_NOT_FOUND") {
        errorMessage = "User not found."
      } else if (error.code === "ACCOUNT_LOCKED") {
        errorMessage = "Your account has been locked. Please contact support."
      } else if (error.message) {
        errorMessage = error.message
      }

      setAuthError(errorMessage)

      return {
        success: false,
        message: errorMessage,
        code: error.code,
      }
    }
  }

  // Enhanced logout function that also clears cookies
  const logout = async () => {
    try {
      // Call the logout endpoint to clear HTTP-only cookies
      await apiRequest("POST", "api/auth/logout")
    } catch (error) {
      console.error("Error during logout:", error)
    } finally {
      // Clear local storage and state regardless of server response
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")
      delete axiosInstance.defaults.headers.common["Authorization"]
      setUser(null)
      setIsAuthenticated(false)
      navigate("/login")
    }
  }

  // Check if token is about to expire
  const checkTokenExpiration = () => {
    const token = localStorage.getItem("accessToken")
    if (!token) return false

    try {
      // JWT tokens are in format: header.payload.signature
      const payload = token.split(".")[1]
      if (!payload) return false

      // Decode the base64 payload
      const decodedPayload = JSON.parse(atob(payload))

      // Check if exp (expiration time) exists
      if (!decodedPayload.exp) return false

      // Get current time in seconds
      const currentTime = Math.floor(Date.now() / 1000)

      // Check if token will expire in the next 5 minutes
      return decodedPayload.exp - currentTime < 300
    } catch (error) {
      console.error("Error checking token expiration:", error)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        authError,
        login,
        logout,
        register,
        checkTokenExpiration,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

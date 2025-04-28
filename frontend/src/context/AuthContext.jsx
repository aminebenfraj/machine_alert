"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const AuthContext = createContext()

// Create axios instance with base URL
const api = axios.create({
  baseURL: "https://machine-alert.onrender.com/api",
  timeout: 10000, // Set timeout to prevent hanging requests
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Load user data on initial mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("accessToken")

        if (!token) {
          setLoading(false)
          return
        }

        // Set token for all requests
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Fetch current user profile
        const response = await api.get("/users/profile")

        if (response.data) {
          setUser(response.data)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error loading user:", error)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Register function
  const register = async (license, username, email, password) => {
    try {
      const response = await api.post("/auth/register", {
        license,
        username,
        email,
        password,
      })

      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      console.error("Registration error:", error)

      return {
        success: false,
        message: error.response?.data?.error || "Registration failed. Please try again.",
      }
    }
  }

  // Optimized login function
  const login = async (license, password) => {
    try {
      const response = await api.post("/auth/login", {
        license,
        password,
      })

      // Extract token and user data
      const { token, ...userData } = response.data

      // Store token in localStorage
      localStorage.setItem("accessToken", token)

      // Set default auth header
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Store user data
      setUser(userData)
      setIsAuthenticated(true)
      localStorage.setItem("user", JSON.stringify(userData))

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: error.response?.data?.error || "Login failed. Please check your credentials.",
      }
    }
  }

  // Logout function
  const logout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
    setIsAuthenticated(false)
    navigate("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

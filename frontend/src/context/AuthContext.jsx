"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const AuthContext = createContext()

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

        // Set default auth header for all future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

        // Fetch current user profile
        const response = await axios.get("https://machine-alert.onrender.com/api/users/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

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

  const login = async (license, password) => {
    try {
      // Using the correct login endpoint from authRoutes.js
      const response = await axios.post("https://machine-alert.onrender.com/api/auth/login", {
        license,
        password
      })

      console.log("Login response:", response.data)

      // Extract token from response
      const { token } = response.data

      // Store token in localStorage
      localStorage.setItem("accessToken", token)

      // Set default auth header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Get user profile with the token
      const userResponse = await axios.get("https://machine-alert.onrender.com/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (userResponse.data) {
        localStorage.setItem("user", JSON.stringify(userResponse.data))
        setUser(userResponse.data)
        setIsAuthenticated(true)
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        message: error.response?.data?.error || "Login failed. Please check your credentials.",
      }
    }
  }

  const logout = () => {
    // Clear token and user from localStorage
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")

    // Remove auth header
    delete axios.defaults.headers.common["Authorization"]

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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
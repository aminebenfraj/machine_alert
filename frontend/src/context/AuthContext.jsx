"use client"

import { createContext, useState, useEffect, useContext } from "react"
import { getCurrentUser } from "../lib/Auth"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const initAuth = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Failed to fetch user:", error)
      // Clear token if authentication fails
      localStorage.removeItem("accessToken")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      initAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (license, password) => {
    try {
      const response = await fetch("https://machine-alert.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ license, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }

      const data = await response.json()
      localStorage.setItem("accessToken", data.token)
      setUser(data)
      return data
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (license, username, email, password) => {
    try {
      const response = await fetch("https://machine-alert.onrender.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ license, username, email, password, roles: ["User"] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Registration failed")
      }

      return await response.json()
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("accessToken")
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

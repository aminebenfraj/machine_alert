"use client"

import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

/**
 * ProtectedRoute component that checks if the user is authenticated
 * If not authenticated, redirects to the login page
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {React.ReactNode} - The protected route component
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-b-2 border-gray-900 rounded-full animate-spin"></div>
      </div>
    )
  }

  // If not authenticated, redirect to login with the return URL
  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />
  }

  // If authenticated, render the children
  return children
}

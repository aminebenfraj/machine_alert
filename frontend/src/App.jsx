"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import ProtectedRoute from "./components/protected-route"
import Unauthorized from "./pages/auth/Unauthorized"
import AppLayout from "./components/AppLayout"

// Auth Pages
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

// Admin Pages
import AdminDashboard from "./pages/roleMangement/AdminDashboard"
import EditUserRoles from "./pages/roleMangement/EditUserRoles"
import CreateUser from "./pages/roleMangement/CreateUser"

// Home Page
import Home from "./pages/logistic/call"

// User Pages
import ProfilePage from "./pages/user/profile-page"
import SettingsPage from "./pages/user/settings-page"

// Machine Pages
import ShowMachines from "./pages/gestionStock/machine/ShowMachines"
import CreateMachine from "./pages/gestionStock/machine/CreateMachine"
import EditMachine from "./pages/gestionStock/machine/EditMachine"

// Logistic Pages
import Call from "./pages/logistic/call"

function App() {
  // Define simplified role groups
  const adminRoles = ["Admin"]
  const productionRoles = ["PRODUCCION"]
  const logisticRoles = ["LOGISTICA"]

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes - no layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Unauthorized page */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Home route */}
          <Route path="/" element={<Home />} />

          {/* User profile routes - accessible by all authenticated users */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Admin routes - only accessible by Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={adminRoles}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/edit-user/:license"
            element={
              <ProtectedRoute requiredRoles={adminRoles}>
                <EditUserRoles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-user"
            element={
              <ProtectedRoute requiredRoles={adminRoles}>
                <CreateUser />
              </ProtectedRoute>
            }
          />

          {/* Machine routes - Admin can manage machines */}
          <Route
            path="/machines"
            element={
              <ProtectedRoute>
                <ShowMachines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines/create"
            element={
              <ProtectedRoute requiredRoles={adminRoles}>
                <CreateMachine />
              </ProtectedRoute>
            }
          />
          <Route
            path="machines/edit/:id"
            element={
              <ProtectedRoute requiredRoles={adminRoles}>
                <EditMachine />
              </ProtectedRoute>
            }
          />
         

          {/* Call routes - PRODUCCION can create calls, LOGISTICA can view and complete them */}
          <Route
            path="/call"
            element={
              <ProtectedRoute>
                <Call />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

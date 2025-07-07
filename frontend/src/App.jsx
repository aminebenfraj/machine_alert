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

// User Pages
import ProfilePage from "./pages/user/profile-page"
import SettingsPage from "./pages/user/settings-page"

// Dashboard Pages
import Dashboard from "./pages/Dashboard"
import FactoriesView from "./pages/FactoriesView"

// Category Pages
import ShowCategories from "./pages/categories/ShowCategories"
import CreateCategory from "./pages/categories/CreateCategory"
import EditCategory from "./pages/categories/EditCategory"

// Factory Pages
import ShowFactories from "./pages/factories/ShowFactories"
import CreateFactory from "./pages/factories/CreateFactory"
import EditFactory from "./pages/factories/EditFactory"

// Machine Pages
import ShowMachines from "./pages/gestionStock/machine/ShowMachines"
import CreateMachine from "./pages/gestionStock/machine/CreateMachine"
import EditMachine from "./pages/gestionStock/machine/EditMachine"

// Call Pages
import CallDashboard from "./pages/logistic/call"

// Legacy Call Page (for backward compatibility)
import LegacyCall from "./pages/logistic/call"

function App() {
  // Define simplified role groups
  const adminRoles = ["Admin"]
  const productionRoles = ["PRODUCCION"]
  const logisticRoles = ["LOGISTICA"]
  const managementRoles = ["Admin", "PRODUCCION"] // Roles that can manage categories/factories

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

          {/* Main Dashboard - Categories View */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Factories View - Shows factories for a category */}
          <Route path="/factories/:categoryId" element={<FactoriesView />} />

          {/* Calls View - Shows calls for a specific factory */}
          <Route path="/calls/:factoryId" element={<CallDashboard />} />

          {/* Legacy call route for backward compatibility */}
          <Route
            path="/call"
            element={
              <ProtectedRoute>
                <LegacyCall />
              </ProtectedRoute>
            }
          />

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

          {/* Category Management Routes - Admin and PRODUCCION */}
          <Route
            path="/categories"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <ShowCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories/create"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <CreateCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories/edit/:id"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <EditCategory />
              </ProtectedRoute>
            }
          />

          {/* Factory Management Routes - Admin and PRODUCCION */}
          <Route
            path="/factories"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <ShowFactories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factories/create/:categoryId"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <CreateFactory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factories/create"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <CreateFactory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factories/edit/:id"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <EditFactory />
              </ProtectedRoute>
            }
          />

          {/* Machine routes - All authenticated users can view, Admin and PRODUCCION can manage */}
          <Route
            path="/machines"
            element={
              <ProtectedRoute>
                <ShowMachines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines/:factoryId"
            element={
              <ProtectedRoute>
                <ShowMachines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines/create"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <CreateMachine />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines/edit/:id"
            element={
              <ProtectedRoute requiredRoles={managementRoles}>
                <EditMachine />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

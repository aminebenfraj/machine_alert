import { Routes, Route, Navigate } from "react-router-dom"
import MainNav from "./components/main-nav"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import { AuthProvider } from "./context/AuthContext"
import AdminDashboard from "./pages/roleMangement/AdminDashboard"
import EditUserRoles from "./pages/roleMangement/EditUserRoles"
import CreateUser from "./pages/roleMangement/CreateUser"
import CreateMachine from "./pages/gestionStock/machine/CreateMachine"
import EditMachine from "./pages/gestionStock/machine/EditMachine"
import ShowMachines from "./pages/gestionStock/machine/ShowMachines"
import Call from "./pages/logistic/call"
import ProfilePage from "./pages/user/profile-page"
import SettingsPage from "./pages/user/settings-page"
import ProtectedRoute from "./components/protected-route"

function App() {
  return (
    <AuthProvider>
      <MainNav />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-user/:license"
          element={
            <ProtectedRoute>
              <EditUserRoles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-user"
          element={
            <ProtectedRoute>
              <CreateUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/machines/create"
          element={
            <ProtectedRoute>
              <CreateMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="machines/edit/:id"
          element={
            <ProtectedRoute>
              <EditMachine />
            </ProtectedRoute>
          }
        />
        <Route
          path="machines"
          element={
            <ProtectedRoute>
              <ShowMachines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/call"
          element={
            <ProtectedRoute>
              <Call />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route - redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

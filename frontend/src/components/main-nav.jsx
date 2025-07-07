"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import {
  Settings,
  LogOut,
  Menu,
  X,
  User,
  PhoneCall,
  Wrench,
  Shield,
  Home,
  Factory,
  Building2,
  Users,
  LayoutDashboard,
  FolderOpen,
  UserPlus,
  BarChart3,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function MainNav() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Set mounted to true after component mounts to avoid hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.roles?.includes(role)
  }

  // Check if user is admin or production
  const isAdmin = hasRole("Admin")
  const isProduction = hasRole("PRODUCCION")
  const isLogistics = hasRole("LOGISTICA")
  const canManage = isAdmin || isProduction

  // Navigation structure for management users
  const managementNavigation = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Vista principal del sistema",
    },
    {
      title: "Gestión",
      icon: FolderOpen,
      items: [
        {
          title: "Categorías",
          href: "/categories",
          icon: Factory,
          description: "Gestionar categorías de fábricas",
        },
        {
          title: "Fábricas",
          href: "/factories",
          icon: Building2,
          description: "Gestionar fábricas del sistema",
        },
        {
          title: "Máquinas",
          href: "/machines",
          icon: Wrench,
          description: "Gestionar máquinas y equipos",
        },
      ],
    },
  ]

  // Admin-only navigation
  const adminNavigation = [
    {
      title: "Administración",
      icon: Shield,
      items: [
        {
          title: "Panel Admin",
          href: "/admin",
          icon: Shield,
          description: "Panel de administración",
        },
        {
          title: "Crear Usuario",
          href: "/admin/create-user",
          icon: UserPlus,
          description: "Crear nuevos usuarios",
        },
        {
          title: "Gestión Usuarios",
          href: "/admin/users",
          icon: Users,
          description: "Gestionar usuarios del sistema",
        },
      ],
    },
  ]

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/novares-logo.webp" alt="Novares" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        {user && canManage && (
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="gap-2">
              {/* Dashboard Link */}
              <NavigationMenuItem>
                <Link to="/dashboard">
                  <NavigationMenuLink
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${
                      location.pathname === "/dashboard" ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {/* Management Dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="h-10">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Gestión
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <div className="grid gap-1">
                      <h4 className="mb-2 text-sm font-medium leading-none">Gestión del Sistema</h4>
                      <Link
                        to="/categories"
                        className="block p-3 space-y-1 leading-none no-underline transition-colors rounded-md outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Factory className="w-4 h-4" />
                          <div className="text-sm font-medium leading-none">Categorías</div>
                        </div>
                        <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
                          Gestionar categorías de fábricas
                        </p>
                      </Link>
                      <Link
                        to="/factories"
                        className="block p-3 space-y-1 leading-none no-underline transition-colors rounded-md outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <div className="text-sm font-medium leading-none">Fábricas</div>
                        </div>
                        <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
                          Gestionar fábricas del sistema
                        </p>
                      </Link>
                      <Link
                        to="/machines"
                        className="block p-3 space-y-1 leading-none no-underline transition-colors rounded-md outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4" />
                          <div className="text-sm font-medium leading-none">Máquinas</div>
                        </div>
                        <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
                          Gestionar máquinas y equipos
                        </p>
                      </Link>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              {/* Admin-only Dropdown */}
              {isAdmin && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-10">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-[350px]">
                      <div className="grid gap-1">
                        <h4 className="mb-2 text-sm font-medium leading-none">Administración</h4>
                        <Link
                          to="/admin"
                          className="block p-3 space-y-1 leading-none no-underline transition-colors rounded-md outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <div className="text-sm font-medium leading-none">Panel Admin</div>
                          </div>
                          <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
                            Panel de administración del sistema
                          </p>
                        </Link>
                        <Link
                          to="/admin/create-user"
                          className="block p-3 space-y-1 leading-none no-underline transition-colors rounded-md outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            <div className="text-sm font-medium leading-none">Crear Usuario</div>
                          </div>
                          <p className="text-sm leading-snug line-clamp-2 text-muted-foreground">
                            Crear nuevos usuarios del sistema
                          </p>
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        )}

        {/* Simple navigation for logistics users */}
        {user && isLogistics && !canManage && (
          <nav className="hidden lg:flex lg:items-center lg:gap-6">
            <Link
              to="/dashboard"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              to="/call"
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/call" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <PhoneCall className="w-4 h-4" />
              Llamadas
            </Link>
          </nav>
        )}

        {/* User Menu (Desktop) */}
        {user && (
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              {user.roles && user.roles.length > 0 && (
                <Badge variant="outline" className="hidden lg:inline-flex">
                  {user.roles.join(", ")}
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 rounded-full" size="icon">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.image || "/placeholder.svg?height=32&width=32"} alt={user.username} />
                      <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {user.roles && (
                        <div className="flex gap-1 mt-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t lg:hidden"
        >
          <div className="container px-4 py-4 space-y-4">
            {user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40"} alt={user.username} />
                    <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                    {user.roles && (
                      <div className="flex gap-1 mt-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col space-y-2">
                  {/* Dashboard */}
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                      location.pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>

                  {canManage && (
                    <>
                      <Separator className="my-2" />
                      <div className="px-3 py-2">
                        <h4 className="text-sm font-medium text-muted-foreground">GESTIÓN</h4>
                      </div>
                      <Link
                        to="/categories"
                        className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                          location.pathname === "/categories"
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Factory className="w-5 h-5" />
                        Categorías
                      </Link>
                      <Link
                        to="/factories"
                        className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                          location.pathname === "/factories"
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                        Fábricas
                      </Link>
                      <Link
                        to="/machines"
                        className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                          location.pathname === "/machines"
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Wrench className="w-5 h-5" />
                        Máquinas
                      </Link>
                    </>
                  )}

                  <Link
                    to="/call"
                    className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                      location.pathname === "/call" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <PhoneCall className="w-5 h-5" />
                    Sistema de Llamadas
                  </Link>

                  {isAdmin && (
                    <>
                      <Separator className="my-2" />
                      <div className="px-3 py-2">
                        <h4 className="text-sm font-medium text-muted-foreground">ADMINISTRACIÓN</h4>
                      </div>
                      <Link
                        to="/admin"
                        className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                          location.pathname === "/admin" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <Shield className="w-5 h-5" />
                        Panel Admin
                      </Link>
                      <Link
                        to="/admin/create-user"
                        className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                          location.pathname === "/admin/create-user"
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <UserPlus className="w-5 h-5" />
                        Crear Usuario
                      </Link>
                    </>
                  )}

                  <Separator className="my-2" />
                  <Link
                    to="/profile"
                    className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                      location.pathname === "/profile" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Perfil
                  </Link>
                  <Link
                    to="/settings"
                    className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                      location.pathname === "/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    Configuración
                  </Link>
                </nav>

                {/* Logout button */}
                <Button variant="destructive" className="w-full mt-4" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                    location.pathname === "/login" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Home className="w-5 h-5" />
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className={`flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors ${
                    location.pathname === "/register" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </header>
  )
}

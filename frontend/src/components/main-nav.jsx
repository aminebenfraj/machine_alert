"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { Settings, LogOut, Menu, X, User, PhoneCall, Wrench, Shield, Home } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

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

  // Check if user is admin
  const isAdmin = hasRole("Admin")

  // Navigation items based on user roles
  const navItems = [
    // All authenticated users can see these
    ...(user
      ? [
          {
            name: "Call Dashboard",
            path: "/",
            icon: PhoneCall,
            roles: ["PRODUCCION", "LOGISTICA"],
          },
          {
            name: "Machines",
            path: "/machines",
            icon: Wrench,
            roles: ["Admin", "PRODUCCION", "LOGISTICA"],
          },
          {
            name: "Profile",
            path: "/profile",
            icon: User,
            roles: ["*"], // All authenticated users
          },
          {
            name: "Settings",
            path: "/settings",
            icon: Settings,
            roles: ["*"], // All authenticated users
          },
        ]
      : []),

    // Admin-only items
    ...(isAdmin
      ? [
          {
            name: "Admin Dashboard",
            path: "/admin",
            icon: Shield,
            roles: ["Admin"],
          },
        ]
      : []),
  ]

  // Filter nav items based on user roles
  const filteredNavItems = navItems.filter(
    (item) => item.roles.includes("*") || item.roles.some((role) => hasRole(role)),
  )

  if (!mounted) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to={"/"} className="flex items-center gap-2">
          <img src="/novares-logo.webp" alt="Novares" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {user && (
            <>
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                    location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
            </>
          )}

          {!user && (
            <>
              <Link
                to="/"
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Home className="w-4 h-4" />
                Login
              </Link>
              <Link
                to="/register"
                className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === "/register" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <User className="w-4 h-4" />
                Register
              </Link>
            </>
          )}
        </nav>

        {/* User Menu (Desktop) */}
        {user && (
          <div className="hidden md:flex md:items-center md:gap-4">
            <div className="flex items-center gap-2">
              {user.roles && user.roles.length > 0 && (
                <Badge variant="outline" className="hidden lg:inline-flex">
                  {user.roles[0]}
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
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden"
        >
          <div className="container px-4 py-4 space-y-4">
            {user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.image || "/placeholder.svg?height=40&width=40"} alt={user.username} />
                    <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>

                {/* Navigation links */}
                <nav className="flex flex-col space-y-2">
                  {filteredNavItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent ${
                        location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Logout button */}
                <Button variant="destructive" className="w-full" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/"
                  className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent ${
                    location.pathname === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Home className="w-5 h-5" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent ${
                    location.pathname === "/register" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  <User className="w-5 h-5" />
                  Register
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </header>
  )
}

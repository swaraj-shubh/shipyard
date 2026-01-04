import React, { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { FaBars, FaTimes, FaUser, FaTasks, FaFileAlt, FaHome, FaCog } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Shield, User, FileText, PlusCircle, LogOut, Menu, X, Award, Wallet } from "lucide-react"

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [role, setRole] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userRole = localStorage.getItem("role")
    const adminToken = localStorage.getItem("adminToken")

    setIsAuthenticated(!!token || !!adminToken)
    setRole(userRole)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("adminToken")
    setIsAuthenticated(false)
    setRole(null)
    navigate("/")
  }

  const getLinkClass = (path) => {
    const isActive = location.pathname === path
    return `px-4 py-2 rounded-lg transition-all duration-200 font-medium flex items-center gap-2 ${
      isActive 
        ? 'text-teal-700 bg-teal-50 border border-teal-200 shadow-sm' 
        : 'text-gray-700 hover:text-teal-600 hover:bg-teal-50'
    }`
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <header className="bg-white text-gray-800 shadow-lg border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="container flex items-center justify-between p-4 mx-auto">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight hover:opacity-90 group"
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Shipyard
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="flex gap-2 items-center">
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/" className={getLinkClass("/")}>
                  <FaHome className="h-4 w-4" />
                  Home
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {role === "user" && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/dashboard" className={getLinkClass("/dashboard")}>
                    <FaTasks className="h-4 w-4" />
                    Tasks
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {role === "admin" && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/admin/dashboard" className={getLinkClass("/admin/dashboard")}>
                    <PlusCircle className="h-4 w-4" />
                    Create Task
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {(role === "admin") && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/admin/form" className={getLinkClass("/admin/form")}>
                    <FaFileAlt className="h-4 w-4" />
                    My Forms
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {/* Authentication Links */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              {role === "user" && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/profile" className={getLinkClass("/profile")}>
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {role === "admin" && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/admin/profile" className={getLinkClass("/admin/profile")}>
                      <Shield className="h-4 w-4" />
                      My Profile
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {role === "user" && (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/my-submissions" className={getLinkClass("/my-submissions")}>
                      <FileText className="h-4 w-4" />
                      My Submissions
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )}

              {/* Admin Auth Links (when not authenticated) */}
              {!isAuthenticated && (
                <>
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/admin/auth" className={getLinkClass("/admin/auth")}>
                        <Shield className="h-4 w-4" />
                        Organisation Login
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/admin/register" className={getLinkClass("/admin/register")}>
                        <Award className="h-4 w-4" />
                        Organisation Register
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </>
              )}

              {/* Main Auth Button */}
              <NavigationMenuItem>
                {isAuthenticated ? (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="default"
                      onClick={() => navigate("/auth")}
                      className="bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      User Login
                    </Button>
                  </motion.div>
                )}
              </NavigationMenuItem>
            </div>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <motion.button
            onClick={toggleMobileMenu}
            className="h-10 w-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 shadow-xl"
          >
            <div className="container mx-auto p-4 space-y-2">
              {/* Home */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Link
                  to="/"
                  className={getLinkClass("/")}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaHome className="h-4 w-4" />
                  Home
                </Link>
              </motion.div>

              {/* User Dashboard */}
              {role === "user" && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    to="/dashboard"
                    className={getLinkClass("/dashboard")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaTasks className="h-4 w-4" />
                    Tasks
                  </Link>
                </motion.div>
              )}

              {/* Admin Dashboard */}
              {role === "admin" && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    to="/admin/dashboard"
                    className={getLinkClass("/admin/dashboard")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Create Task
                  </Link>
                </motion.div>
              )}

              {/* Admin Forms */}
              {(role === "admin") && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    to="/admin/form"
                    className={getLinkClass("/admin/form")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaFileAlt className="h-4 w-4" />
                    My Forms
                  </Link>
                </motion.div>
              )}

              {/* User Profile */}
              {role === "user" && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    to="/profile"
                    className={getLinkClass("/profile")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </motion.div>
              )}

              {/* Admin Profile */}
              {role === "admin" && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    to="/admin/profile"
                    className={getLinkClass("/admin/profile")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    My Profile
                  </Link>
                </motion.div>
              )}

              {/* User Submissions */}
              {role === "user" && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    to="/my-submissions"
                    className={getLinkClass("/my-submissions")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    My Submissions
                  </Link>
                </motion.div>
              )}

              {/* Admin Auth Links (when not authenticated) */}
              {!isAuthenticated && (
                <>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Link
                      to="/admin/auth"
                      className={getLinkClass("/admin/auth")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Login
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link
                      to="/admin/register"
                      className={getLinkClass("/admin/register")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Award className="h-4 w-4" />
                      Admin Register
                    </Link>
                  </motion.div>
                </>
              )}

              {/* Authentication Button */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="pt-4 border-t border-gray-200"
              >
                {isAuthenticated ? (
                  <Button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      navigate("/auth")
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    User Login
                  </Button>
                )}
              </motion.div>

              {/* Current User Info */}
              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs text-gray-500 pt-2 border-t border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center">
                      {role === "admin" ? (
                        <Shield className="h-3 w-3 text-teal-600" />
                      ) : (
                        <User className="h-3 w-3 text-teal-600" />
                      )}
                    </div>
                    <span className="font-medium">
                      {role === "admin" ? "Administrator" : "User"}
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
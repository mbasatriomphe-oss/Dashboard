"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

// Simulated users (in production, this would come from Laravel backend)
const MOCK_USERS = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Administrator",
    email: "admin@pos.com",
  },
  {
    id: "2",
    username: "seller1",
    password: "seller123",
    role: "seller",
    name: "John Seller",
    email: "john@pos.com",
  },
  {
    id: "3",
    username: "seller2",
    password: "seller123",
    role: "seller",
    name: "Jane Seller",
    email: "jane@pos.com",
  },
]

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("pos_user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error)
        localStorage.removeItem("pos_user")
      }
    }
    setIsLoading(false)
  }, [])

  // Redirect logic based on auth state
  useEffect(() => {
    if (isLoading) return

    const isLoginPage = pathname === "/login"
    const isAdminRoute = pathname?.startsWith("/admin")

    if (!user && !isLoginPage) {
      router.push("/login")
    } else if (user && isLoginPage) {
      router.push("/")
    } else if (user && isAdminRoute && user.role !== "admin") {
      router.push("/access-denied")
    }
  }, [user, isLoading, pathname, router])

  // Simulated login function (would call Laravel API in production)
  const login = async (username, password) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const foundUser = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    )

    if (foundUser) {
      const userWithoutPassword = {
        id: foundUser.id,
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
        email: foundUser.email,
      }
      setUser(userWithoutPassword)
      localStorage.setItem("pos_user", JSON.stringify(userWithoutPassword))
      return { success: true, user: userWithoutPassword }
    }

    return { success: false, error: "Invalid username or password" }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("pos_user")
    router.push("/login")
  }

  const isAdmin = () => {
    return user?.role === "admin"
  }

  const isSeller = () => {
    return user?.role === "seller"
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isSeller,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

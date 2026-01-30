

import React, { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(undefined)

// Demo users for testing
const DEMO_USERS = [
  {
    id: "1",
    name: "John Doe",
    email: "user@demo.com",
    role: "user",
    avatar: "/diverse-user-avatars.png",
    interests: ["Technology", "Sports", "Music"],
    status: "active",
    lastActive: new Date(),
    registrationDate: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@demo.com",
    role: "admin",
    avatar: "/admin-avatar.png",
    interests: ["Management", "Analytics"],
    status: "active",
    lastActive: new Date(),
    registrationDate: new Date("2024-01-01"),
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane@demo.com",
    role: "user",
    avatar: "/female-user-avatar.png",
    interests: ["Art", "Technology", "Travel"],
    status: "active",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    registrationDate: new Date("2024-02-01"),
  },
  {
    id: "4",
    name: "Mike Johnson",
    email: "mike@demo.com",
    role: "user",
    avatar: "/male-user-avatar.png",
    interests: ["Sports", "Gaming", "Music"],
    status: "suspended",
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    registrationDate: new Date("2024-01-20"),
    suspensionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("chatapp-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("chatapp-user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Demo login logic - accept any password for demo users
    const foundUser = DEMO_USERS.find((u) => u.email === email)

    if (foundUser && foundUser.status === "active") {
      const userWithUpdatedActivity = {
        ...foundUser,
        lastActive: new Date(),
      }
      setUser(userWithUpdatedActivity)
      localStorage.setItem("chatapp-user", JSON.stringify(userWithUpdatedActivity))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("chatapp-user")
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, isLoading }}>
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

// Export demo users for admin dashboard
export { DEMO_USERS }

// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const clearAuthStorage = () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        // Legacy/demo key used elsewhere in the repo; clear to avoid stale UI if referenced
        localStorage.removeItem("chatapp-user")
    }

    useEffect(() => {
        // Load user & token from localStorage on app start
        const storedUser = localStorage.getItem("user")
        const storedToken = localStorage.getItem("token")

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser)) // ✅ parse instead of stringify
            setToken(storedToken)
        }
    }, [])

    const login = async (data) => {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        clearAuthStorage()
    }

    const updateUser = (updatedUser) => {
        const newUser = { ...user, ...updatedUser }
        setUser(newUser)
        localStorage.setItem("user", JSON.stringify(newUser))
    }

    const value = {
        user,
        token,
        login,
        logout,
        updateUser,
        isLoading,
        setIsLoading,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

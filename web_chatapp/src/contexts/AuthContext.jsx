// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react"
import heartbeatService from "../services/heartbeatService"
import { resetAllApiCaches, resetDataApiCaches } from "../app/store"
import { disconnectEcho } from "../services/echo"

const AuthContext = createContext()

function readStoredAuth() {
    try {
        const storedUser = localStorage.getItem("user")
        const storedToken = localStorage.getItem("token")
        if (storedUser && storedToken) {
            return { user: JSON.parse(storedUser), token: storedToken }
        }
    } catch {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
    }
    return { user: null, token: null }
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

export const AuthProvider = ({ children }) => {
    const [initialAuth] = useState(readStoredAuth)
    const [user, setUser] = useState(initialAuth.user)
    const [token, setToken] = useState(initialAuth.token)
    const [isLoading, setIsLoading] = useState(false)

    const clearAuthStorage = () => {
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        localStorage.removeItem("chatapp-user")
        localStorage.removeItem("tokenType")
        localStorage.removeItem("authToken")
    }

    useEffect(() => {
        if (token) {
            heartbeatService.start(token)
        } else {
            heartbeatService.stop()
        }
        return () => heartbeatService.stop()
    }, [token])

    const login = async (data) => {
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)
        setUser(data.user)
        setToken(data.token)
        resetDataApiCaches()
        disconnectEcho()
    }

    const logout = async () => {
        await heartbeatService.markOffline()
        heartbeatService.stop()
        disconnectEcho()
        resetAllApiCaches()
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
        authReady: true,
        login,
        logout,
        updateUser,
        isLoading,
        setIsLoading,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

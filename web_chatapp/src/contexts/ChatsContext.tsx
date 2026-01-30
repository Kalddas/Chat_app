// File: src/contexts/ChatsContext.jsx
import { createContext, useContext, useCallback, useState } from "react"

const ChatsContext = createContext()

export function ChatsProvider({ children }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const triggerChatsRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1) // increments to notify refresh
    }, [])

    return (
        <ChatsContext.Provider value={{ refreshTrigger, triggerChatsRefresh }}>
            {children}
        </ChatsContext.Provider>
    )
}

export const useChatsContext = () => useContext(ChatsContext)

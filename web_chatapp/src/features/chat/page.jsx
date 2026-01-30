

// import { useAuth } from "../../contexts/AuthContext"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ChatLayout } from "@/components/chat/ChatLayout"

export default function ChatPage() {
  // const { user, loading } = useAuth()
  const navigate = useNavigate()

  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate("/login")
  //   } else if (user && user.role === "admin") {
  //     navigate("/admin")
  //   } else {
  //     navigate("/chat")
  //   }
  // }, [user, loading, navigate])

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
  //         <p className="text-muted-foreground">Loading...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // if (!user || user.role !== "user") {
  //   return null
  // }

  return <ChatLayout />
}

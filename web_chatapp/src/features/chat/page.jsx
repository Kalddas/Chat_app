
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/LoadingSpinner"
import { ChatLayout } from "@/components/chat/ChatLayout"

export default function ChatPage() {
  const { user } = useAuth()

  if (!user?.id) {
    return <LoadingSpinner />
  }

  return <ChatLayout key={user.id} />
}

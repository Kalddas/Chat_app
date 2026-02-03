
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, UserPlus } from "lucide-react"
import {
  useAcceptRequestMutation,
  useGetReceivedRequestsQuery,
  useRejectRequestMutation,
} from "../../../services/chatService"
import { useAuth } from "../../../contexts/AuthContext"
import { useChatsContext } from "../../../contexts/ChatsContext"

export function RequestsView() {
  const { data, isLoading, isError } = useGetReceivedRequestsQuery()
  const [acceptRequest] = useAcceptRequestMutation()
  const [rejectRequest] = useRejectRequestMutation()
  const [localRequests, setLocalRequests] = useState([])
  const { triggerChatsRefresh } = useChatsContext()

  const { user } = useAuth()

  console.log("RequestsView - data:", data)
  console.log("RequestsView - isLoading:", isLoading)
  console.log("RequestsView - isError:", isError)
  // Sync API data to local state
  useEffect(() => {
    if (data) {
      setLocalRequests(
        data.map((req) => ({
          id: req.request_id,
          name: req.sender_name,
          email: req.user_name, // API doesn't provide email, using username
          avatar: req.profile_picture_url || "/placeholder.svg",
          status: "Pending",
          timestamp: new Date(req.created_at).toLocaleString(),
        }))
      )
    }
  }, [data])

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptRequest({ requestId, userId: user.id }).unwrap()
      setLocalRequests(localRequests.filter((req) => req.id !== requestId))
      console.log("✅ Accepted request:", requestId)

      // 🔹 tell ChatsView to refresh
      triggerChatsRefresh()
    } catch (err) {
      console.error("❌ Failed to accept request:", err)
    }
  }

  const handleDeclineRequest = async (requestId) => {
    try {
      await rejectRequest({ requestId }).unwrap()
      setLocalRequests(localRequests.filter((req) => req.id !== requestId))
      console.log("❌ Declined request:", requestId)
    } catch (err) {
      console.error("❌ Failed to decline request:", err)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center text-indigo-600 dark:text-foreground bg-background dark:bg-background h-full flex items-center justify-center">Loading requests...</div>
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500 dark:text-red-400 bg-background dark:bg-background h-full flex items-center justify-center">Failed to load requests</div>
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto bg-background dark:bg-background h-full">
      {localRequests.length === 0 ? (
        <div className="text-center py-8">
          <UserPlus className="h-12 w-12 text-indigo-400 dark:text-foreground mx-auto mb-4" />
          <p className="text-indigo-600 dark:text-foreground">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {localRequests.map((request) => (
            <Card key={request.id} className="border-indigo-200 dark:border-white/30 dark:bg-background">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12 border-2 border-indigo-100 dark:border-white/30">
                    <AvatarImage src={request.avatar} alt={request.name} />
                    <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">{request.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-indigo-900 dark:text-foreground">{request.name}</h4>
                    <p className="text-sm text-indigo-600 dark:text-foreground/70">{request.email}</p>
                    <p className="text-xs text-indigo-600 dark:text-foreground/70">{request.timestamp}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineRequest(request.id)}
                    className="flex-1 border-indigo-300 dark:border-white/30 text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>

  )
}

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Search } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { useGetMatchesQuery } from "../../../services/authService"
import { useSendChatRequestMutation } from "../../../services/chatService"
import { toast } from "react-toastify"

export function DiscoveryView() {
  const { user } = useAuth()
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const { data, isLoading, isError, refetch } = useGetMatchesQuery()
  const [sendChatRequest, { isLoading: isSendingRequest }] = useSendChatRequestMutation()

  // Sync sent requests with API data
  useEffect(() => {
    if (data?.data) {
      const pendingRequests = data.data
        .filter(match => match.status === 'pending' || match.status === 'accepted')
        .map(match => match.user.id)
      setSentRequests(pendingRequests)
    }
  }, [data])

  // Convert API matches to a user-like structure and sort by score descending
  const apiUsers = (data?.data?.map((match) => ({
    id: match.user.id,
    name: `${match.user.first_name} ${match.user.last_name}`,
    email: match.user.email,
    avatar: match.user.profile_picture_url || "/placeholder.svg",
    score: match.score,
    status: match.status
  })) || []).sort((a, b) => b.score - a.score) // Sort by score descending (highest first)

  // Apply search filter
  // Apply search filter + exclude users with pending/handled requests
  const filteredUsers = (searchQuery
    ? apiUsers.filter(u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : apiUsers
  ).filter(u =>
    !sentRequests.includes(u.id) &&
    u.status !== "pending" &&   // 🔑 hide if request already exists
    u.status !== "accepted" &&  // optionally hide if already connected
    u.status !== "rejected"     // optionally hide if rejected before
  )


  const handleSendRequest = async (userId) => {
    try {
      const result = await sendChatRequest({
        receiver_id: userId
      }).unwrap()

      // Success - add to sent requests and refetch data
      setSentRequests([...sentRequests, userId])
      toast.success("Chat request sent successfully!")
      refetch() // Refresh the list to update statuses
    } catch (err) {
      // Handle different error types
      let errorMessage = "Failed to send chat request"

      if (err?.data?.error) {
        errorMessage = err.data.error
      } else if (err?.data?.message) {
        errorMessage = err.data.message
      } else if (err?.status === 400) {
        errorMessage = "A request already exists or was previously handled"
      }

      // If it's a duplicate request, update the UI to reflect that
      if (errorMessage.includes("already exists") || errorMessage.includes("previously handled")) {
        setSentRequests([...sentRequests, userId])
        refetch() // Refresh to get updated status
      }

      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-center text-indigo-600 dark:text-foreground bg-background dark:bg-background h-full flex items-center justify-center">Loading recommendations...</div>
  }

  if (isError) {
    return <div className="p-4 text-center text-red-500 dark:text-red-400 bg-background dark:bg-background h-full flex items-center justify-center">Failed to load recommendations</div>
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-2rem)] overflow-y-auto bg-background dark:bg-background">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-600 dark:text-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-indigo-300 dark:border-border dark:bg-input dark:text-foreground dark:placeholder:text-muted-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500 dark:focus:ring-primary"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <UserPlus className="h-12 w-12 text-indigo-400 dark:text-foreground mx-auto mb-4" />
          <p className="text-indigo-600 dark:text-foreground">
            {searchQuery ? "No users match your search" : "No recommendations found"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((recommendedUser) => {
            const isRequestSent = sentRequests.includes(recommendedUser.id)

            return (
              <Card key={recommendedUser.id} className="hover:shadow-md transition-shadow border-indigo-200 dark:border-border dark:bg-background">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12 border-2 border-indigo-100 dark:border-border">
                      <AvatarImage src={recommendedUser.avatar} alt={recommendedUser.name} />
                      <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
                        {recommendedUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-indigo-900 dark:text-foreground">{recommendedUser.name}</h4>
                      <p className="text-sm text-indigo-600 dark:text-foreground/70">
                        Match Score: {Math.round(parseFloat(recommendedUser.score) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendRequest(recommendedUser.id)}
                      disabled={isRequestSent || isSendingRequest}
                      className="flex-1 border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      {isSendingRequest ? "Sending..." : isRequestSent ? "Request Sent" : "Send Request"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
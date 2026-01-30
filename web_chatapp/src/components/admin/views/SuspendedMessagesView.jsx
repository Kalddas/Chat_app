import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, MessageSquare, CheckCircle2, Mail, Eye, Send, Reply } from "lucide-react"
import axios from "axios"
import { toast } from "react-toastify"

export function SuspendedMessagesView() {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState("all") // "all", "unread", "read"
  const [respondingTo, setRespondingTo] = useState(null)
  const [responseText, setResponseText] = useState("")
  const [isSendingResponse, setIsSendingResponse] = useState(false)

  useEffect(() => {
    loadMessages()
    loadUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadMessages()
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [filter])

  const loadMessages = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = {}
      if (filter === "unread") params.is_read = false
      if (filter === "read") params.is_read = true

      const response = await axios.get("http://127.0.0.1:8000/api/admin/suspended-messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      })

      if (response.data.success) {
        setMessages(response.data.messages || [])
      }
    } catch (error) {
      console.error("Error loading messages:", error)
      toast.error("Failed to load messages")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://127.0.0.1:8000/api/admin/suspended-messages/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.success) {
        setUnreadCount(response.data.count || 0)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://127.0.0.1:8000/api/admin/suspended-messages/${messageId}/mark-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        toast.success("Message marked as read")
        loadMessages()
        loadUnreadCount()
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
      toast.error("Failed to mark message as read")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        "http://127.0.0.1:8000/api/admin/suspended-messages/mark-all-read",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.data.success) {
        toast.success(`Marked ${response.data.count} messages as read`)
        loadMessages()
        loadUnreadCount()
      }
    } catch (error) {
      console.error("Error marking all messages as read:", error)
      toast.error("Failed to mark all messages as read")
    }
  }

  const handleSendResponse = async (messageId) => {
    if (!responseText.trim()) {
      toast.error("Please enter a response")
      return
    }

    setIsSendingResponse(true)
    try {
      const token = localStorage.getItem("token")
      const response = await axios.post(
        `http://127.0.0.1:8000/api/admin/suspended-messages/${messageId}/respond`,
        { response: responseText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (response.data.success) {
        toast.success("Response sent successfully!")
        setResponseText("")
        setRespondingTo(null)
        loadMessages()
      }
    } catch (error) {
      console.error("Error sending response:", error)
      toast.error(error.response?.data?.message || "Failed to send response")
    } finally {
      setIsSendingResponse(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 dark:text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8" />
              Suspended User Messages
            </h1>
            <p className="text-indigo-600 dark:text-muted-foreground mt-1">
              Messages from suspended users
            </p>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {unreadCount} Unread
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-primary" : "border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"}
          >
            All Messages
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={filter === "unread" ? "bg-primary" : "border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"}
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            onClick={() => setFilter("read")}
            className={filter === "read" ? "bg-primary" : "border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"}
          >
            Read
          </Button>
        </div>

        {/* Messages List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <Card className="border-indigo-200 dark:border-border dark:bg-card">
            <CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 text-indigo-400 dark:text-muted-foreground mx-auto mb-4" />
              <p className="text-indigo-600 dark:text-muted-foreground text-lg">
                No messages found
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`border-indigo-200 dark:border-border dark:bg-card ${
                  !message.is_read ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg text-indigo-900 dark:text-foreground">
                          {message.user?.first_name} {message.user?.last_name}
                          {message.user?.user_name && (
                            <span className="text-sm text-indigo-600 dark:text-muted-foreground ml-2">
                              (@{message.user.user_name})
                            </span>
                          )}
                        </CardTitle>
                        {!message.is_read && (
                          <Badge variant="destructive" className="text-xs">
                            Unread
                          </Badge>
                        )}
                        {message.is_read && (
                          <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
                            Read
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-indigo-600 dark:text-muted-foreground">
                        {message.user?.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-indigo-600 dark:text-muted-foreground">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                      {message.read_at && (
                        <p className="text-xs text-indigo-500 dark:text-muted-foreground mt-1">
                          Read: {new Date(message.read_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-indigo-50 dark:bg-background border border-indigo-200 dark:border-border rounded-lg p-4">
                    <p className="text-sm text-indigo-900 dark:text-foreground whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>

                  {message.admin_response && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          Admin Response:
                        </p>
                      </div>
                      <p className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap">
                        {message.admin_response}
                      </p>
                      {message.responded_at && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          {new Date(message.responded_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!message.is_read && (
                      <Button
                        onClick={() => handleMarkAsRead(message.id)}
                        size="sm"
                        variant="outline"
                        className="border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                    {!message.admin_response && (
                      <Button
                        onClick={() => setRespondingTo(respondingTo === message.id ? null : message.id)}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        {respondingTo === message.id ? "Cancel" : "Respond"}
                      </Button>
                    )}
                  </div>

                  {respondingTo === message.id && (
                    <div className="bg-gray-50 dark:bg-background border border-gray-200 dark:border-border rounded-lg p-4 space-y-3">
                      <Label htmlFor={`response-${message.id}`} className="text-indigo-900 dark:text-foreground">
                        Your Response:
                      </Label>
                      <Textarea
                        id={`response-${message.id}`}
                        placeholder="Type your response to the user..."
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        rows={4}
                        className="border-indigo-300 dark:border-border dark:bg-card dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSendResponse(message.id)}
                          size="sm"
                          className="bg-primary hover:bg-primary/90"
                          disabled={isSendingResponse || !responseText.trim()}
                        >
                          {isSendingResponse ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Response
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setRespondingTo(null)
                            setResponseText("")
                          }}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


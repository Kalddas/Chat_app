import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Bell, MessageSquare, UserPlus, Trash2, X } from "lucide-react"
import axios from "axios"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell({ userId, isAdmin = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    
    loadNotifications()
    loadUnreadCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadNotifications()
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [userId, isAdmin])

  // Refresh when popover opens
  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [isOpen, userId])

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://127.0.0.1:8000/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          limit: 20, // Only show latest 20 notifications
        },
      })

      if (response.data.notifications) {
        setNotifications(response.data.notifications)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await axios.get("http://127.0.0.1:8000/api/notifications/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.data.unread_count !== undefined) {
        setUnreadCount(response.data.unread_count || 0)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        `http://127.0.0.1:8000/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token")
      await axios.put(
        "http://127.0.0.1:8000/api/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message':
      case 'new_suspended_message':
        return <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'chat_request':
        return <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'message_deleted':
        return <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationTitle = (type, data) => {
    switch (type) {
      case 'new_message':
        return 'New Message'
      case 'new_suspended_message':
        return data?.user_name ? `Message from ${data.user_name}` : 'New Suspended User Message'
      case 'chat_request':
        return 'New Chat Request'
      case 'message_deleted':
        return 'Message Deleted'
      default:
        return 'Notification'
    }
  }

  const getNotificationPreview = (type, data) => {
    switch (type) {
      case 'new_message':
        return data?.sender_name 
          ? `${data.sender_name}: ${data?.message_preview || 'sent you a message'}` 
          : data?.message_preview || 'You have a new message'
      case 'new_suspended_message':
        return data?.message_preview || 'A suspended user sent a message'
      case 'chat_request':
        return data?.sender_name ? `${data.sender_name} wants to chat with you` : 'You have a new chat request'
      case 'message_deleted':
        return data?.message_preview ? `"${data.message_preview}" was deleted` : 'A message was deleted'
      default:
        if (data?.message_preview) {
          return data.message_preview
        }
        if (data?.user_name) {
          return `${data.user_name} sent you a message`
        }
        return 'You have a new notification'
    }
  }

  const unreadNotifications = notifications.filter(n => !n.read_at)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
          title={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-indigo-200 dark:border-border">
          <h3 className="font-semibold text-indigo-900 dark:text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-indigo-600 dark:text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-indigo-200 dark:divide-border">
              {notifications.map((notification) => {
                const isUnread = !notification.read_at
                const notificationData = notification.data || {}
                
                // Extract type - API should return simple type, but fallback to data.type
                let notificationType = notification.type || notificationData.type || 'unknown'
                
                // If type is still unknown, try to extract from notification data
                if (notificationType === 'unknown' && notificationData.type) {
                  notificationType = notificationData.type
                }

                return (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-indigo-50 dark:hover:bg-accent cursor-pointer transition-colors ${
                      isUnread ? 'bg-indigo-50/50 dark:bg-accent/30' : ''
                    }`}
                    onClick={() => {
                      if (isUnread) {
                        handleMarkAsRead(notification.id)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium text-indigo-900 dark:text-foreground ${isUnread ? 'font-semibold' : ''}`}>
                              {getNotificationTitle(notificationType, notificationData)}
                            </p>
                            <p className="text-xs text-indigo-600 dark:text-muted-foreground mt-1 line-clamp-2">
                              {getNotificationPreview(notificationType, notificationData)}
                            </p>
                            <p className="text-xs text-indigo-500 dark:text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}


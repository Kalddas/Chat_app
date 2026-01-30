import { useEffect, useRef, useState } from "react"
import { Phone, Video, Bell, Lock, Trash2, Loader2, PhoneCall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useGetUserProfileQuery } from "../../../services/userService"
import { useDeleteConversationMutation } from "../../../services/chatService"
import { useWebSocket } from "../../../contexts/WebSocketContext"
import { useChatsContext } from "../../../contexts/ChatsContext"

export function ContactInfoView({ chatId, selectedChatInfo }) {
  const [deleteConversation, { isLoading: deleting }] = useDeleteConversationMutation()
  const [muteNotifications, setMuteNotifications] = useState(false)
  const [disappearingMessages, setDisappearingMessages] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [callType, setCallType] = useState(null) // 'video' | 'voice'
  const videoRef = useRef(null)
  const localStreamRef = useRef(null)
  const callTimeoutRef = useRef(null)

  // Get current user profile
  const { data: currentUserProfile, isLoading: currentUserLoading } = useGetUserProfileQuery()
  console.log(currentUserProfile)
  const { onlineUsers, connectionState } = useWebSocket()
  const { triggerChatsRefresh } = useChatsContext()

  // Use selectedChatInfo if available, otherwise fallback to mock data
  const contact = selectedChatInfo ? {
    name: selectedChatInfo.name,
    subtitle: `@${selectedChatInfo.username}`,
    avatar: selectedChatInfo.avatar,
    phone: "", // Add phone field to your API if needed
    about: "No bio available", // Add bio field to your API if needed
    lastSeen: (onlineUsers && typeof onlineUsers.has === 'function' && selectedChatInfo?.userId)
      ? (onlineUsers.has(selectedChatInfo.userId) ? "online" : "offline")
      : "offline",
    userId: selectedChatInfo.userId
  } : {
    name: "Unknown User",
    subtitle: "User not found",
    avatar: "/placeholder.svg",
    phone: "",
    about: "No information available",
    lastSeen: "offline",
    userId: null
  }

  const startCall = async (type) => {
    setCallType(type)
    setShowCallDialog(true)

    if (type === "video") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        localStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error("Failed to start video call:", err)
        alert("Could not access your camera/microphone. Please check permissions.")
        setShowCallDialog(false)
        setCallType(null)
      }
    }

    // Notify chat area that a call was attempted so it can be logged in the messages
    if (chatId) {
      window.dispatchEvent(
        new CustomEvent("chat:callAttempt", {
          detail: {
            conversationId: chatId,
            type,
            timestamp: new Date().toISOString(),
          },
        }),
      )
    }
  }

  // Auto-end call after 1 minute whenever a call is active
  useEffect(() => {
    if (!showCallDialog) return

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current)
    }

    callTimeoutRef.current = setTimeout(() => {
      setShowCallDialog(false)
      setCallType(null)
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
    }, 60_000)

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current)
        callTimeoutRef.current = null
      }
    }
  }, [showCallDialog])

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    setShowCallDialog(false)
    setCallType(null)
  }

  const handleDeleteChat = async () => {
    if (!chatId) return
    try {
      await deleteConversation({ conversationId: chatId }).unwrap()
      // Optionally signal chats list to refresh and clear selection
      // Consumers can listen via context; minimal approach is reload or custom event
      window.dispatchEvent(new CustomEvent("chat:deleted", { detail: { conversationId: chatId } }))
      if (typeof triggerChatsRefresh === 'function') triggerChatsRefresh()
      setShowConfirm(false)
    } catch (err) {
      console.error("Delete conversation failed", err)
    }
  }

  // No ringtone or timeout cleanup needed now

  if (currentUserLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <>
    <div className="h-full overflow-y-auto bg-background dark:bg-background">
      {/* Contact Header */}
      <div className="p-6 text-center border-b border-indigo-200 dark:border-border bg-card dark:bg-card">
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-indigo-100 dark:border-border">
          <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
          <AvatarFallback className="text-2xl bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
            {contact.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>

        <h3 className="text-xl font-semibold text-indigo-900 dark:text-foreground mb-1">{contact.name}</h3>
        <p className="text-sm text-indigo-600 dark:text-muted-foreground mb-2">{contact.subtitle}</p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${contact.lastSeen === 'online' ? 'bg-green-500' : 'bg-indigo-300 dark:bg-muted-foreground'
            }`}></div>
          <p className="text-xs text-indigo-600 dark:text-muted-foreground">
            {contact.lastSeen === 'online' ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-4">
          <Button
            size="sm"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            onClick={() => startCall("video")}
          >
            <Video className="h-4 w-4" />
            Video
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-2 border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
            onClick={() => startCall("voice")}
          >
            <Phone className="h-4 w-4" />
            Voice
          </Button>
        </div>
      </div>

      {/* Contact Details */}
      <div className="p-4 space-y-6">
        {/* About */}
        <div>
          <h4 className="text-sm font-medium text-indigo-700 dark:text-muted-foreground mb-2">About</h4>
          <p className="text-sm text-indigo-900 dark:text-foreground">{contact.about}</p>
        </div>

        {/* Phone Number */}
        {contact.phone && (
          <div>
            <h4 className="text-sm font-medium text-indigo-700 dark:text-muted-foreground mb-2">Phone number</h4>
            <p className="text-sm text-indigo-900 dark:text-foreground">{contact.phone}</p>
          </div>
        )}

        <Separator className="bg-indigo-200 dark:bg-border" />

        {/* Media, Files, Links */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-indigo-900 dark:text-foreground">Media, links and docs</span>
            <span className="text-sm text-indigo-600 dark:text-muted-foreground">142 &gt;</span>
          </div>
        </div>

        <Separator className="bg-indigo-200 dark:bg-border" />

        {/* Notifications */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4 text-indigo-600 dark:text-primary" />
            <span className="text-sm text-indigo-900 dark:text-foreground">Mute notifications</span>
          </div>
          <Switch
            checked={muteNotifications}
            onCheckedChange={setMuteNotifications}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {/* Disappearing Messages */}
        <div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-indigo-900 dark:text-foreground">Disappearing messages</span>
            <span className="text-sm text-indigo-600 dark:text-muted-foreground">Off</span>
          </div>
          <p className="text-xs text-indigo-600 dark:text-muted-foreground mt-1">
            Messages will disappear from this chat after the selected duration.
          </p>
        </div>

        {/* Encryption */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Lock className="h-4 w-4 text-indigo-600 dark:text-primary" />
            <div>
              <div className="text-sm text-indigo-900 dark:text-foreground">Encryption</div>
              <div className="text-xs text-indigo-600 dark:text-muted-foreground">Messages are end-to-end encrypted</div>
            </div>
          </div>
        </div>

        <Separator className="bg-indigo-200 dark:bg-border" />

        {/* Danger Zone */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
            onClick={() => setShowConfirm(true)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-3" />
            {deleting ? "Deleting..." : "Delete chat"}
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            Block contact
          </Button>
        </div>
      </div>
    </div>
    <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
      <DialogContent className="bg-card dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle>Delete this chat?</DialogTitle>
          <DialogDescription>
            This action will permanently remove this conversation and all its messages. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteChat} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Call dialog (local preview + ringtone) */}
    <Dialog open={showCallDialog} onOpenChange={(open) => !open && endCall()}>
      <DialogContent className="bg-card dark:bg-card dark:border-border max-w-sm">
        {callType === "video" ? (
          <>
            <DialogHeader>
              <DialogTitle>Video calling {contact.name}</DialogTitle>
              <DialogDescription>Connecting video and audio...</DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full max-w-sm rounded-lg bg-black"
              />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Voice calling {contact.name}</DialogTitle>
              <DialogDescription>Ringing...</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Avatar className="h-20 w-20 border-4 border-indigo-200">
                <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                  {contact.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-indigo-700 dark:text-foreground">
                <PhoneCall className="h-5 w-5 animate-pulse" />
                <span>Calling...</span>
              </div>
            </div>
          </>
        )}

        <DialogFooter className="mt-2 flex justify-center">
          <Button variant="destructive" onClick={endCall} className="w-full">
            End call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
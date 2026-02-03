// File: src/components/chat/ChatLayout.jsx
import { useState, useEffect } from "react"
import { ChatSidebar } from "./ChatSidebar"
import { ChatMain } from "./ChatMain"
import { ChatRightPanel } from "./ChatRightPanel"
import { ProfileView } from "./views/ProfileView"
import { MoodPromptModal } from "./MoodPromptModal"
import { useAuth } from "@/contexts/AuthContext"
import { ChatsProvider } from "../../contexts/ChatsContext"
import { useGetUserProfileQuery } from "../../services/userService"
import { shouldShowMoodPrompt, setMoodPromptShown } from "@/lib/mood"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function ChatLayout() {
  const [currentView, setCurrentView] = useState("chats") // Sidebar view
  const [selectedChat, setSelectedChat] = useState(null)   // Selected chat id
  const [selectedChatInfo, setSelectedChatInfo] = useState(null) // Selected chat info
  const [rightPanelView, setRightPanelView] = useState("none") // Right panel view
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false) // Profile modal
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Mobile sidebar state
  const [showMoodPrompt, setShowMoodPrompt] = useState(false)
  const { user } = useAuth()
  const { data: profileData, isSuccess: profileLoaded, refetch: refetchProfile } = useGetUserProfileQuery(undefined, {
    skip: !user?.id,
  })
  const profile = profileData?.profile

  // Show mood prompt after login / every 24h based on last-shown timestamp
  useEffect(() => {
    if (!user?.id || !profileLoaded || !profile) return
    if (shouldShowMoodPrompt(user.id)) {
      setShowMoodPrompt(true)
    }
  }, [user?.id, profileLoaded])

  const handleViewChange = (view) => {
    if (view === "chats") {
      setCurrentView("chats")
      setRightPanelView("none")
    } else if (view === "profile") {
      setIsProfileModalOpen(true)
    } else {
      setCurrentView("chats")
      setRightPanelView(view)
    }
  }

  const handleChatSelect = (chatId, chatInfo) => {
    setSelectedChat(chatId)
    setSelectedChatInfo(chatInfo)
    setRightPanelView("none")
  }

  // Clear selection and right panel after a chat is deleted
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail?.conversationId === selectedChat) {
        setSelectedChat(null)
        setSelectedChatInfo(null)
        setRightPanelView("none")
      }
    }
    window.addEventListener("chat:deleted", handler)
    return () => window.removeEventListener("chat:deleted", handler)
  }, [selectedChat])

  const handleMoodSet = () => {
    setShowMoodPrompt(false)
    if (user?.id) setMoodPromptShown(user.id)
    refetchProfile()
  }

  if (!user) return null

  return (
    <ChatsProvider>
      <MoodPromptModal
        open={showMoodPrompt}
        onClose={() => setShowMoodPrompt(false)}
        onMoodSet={handleMoodSet}
        onSkip={() => setShowMoodPrompt(false)}
        userId={user?.id}
      />
      <div className="h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:bg-background flex relative">
        {/* Mobile Hamburger Button */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden fixed top-4 left-4 z-50 bg-card dark:bg-background border border-indigo-200 dark:border-white/30 shadow-md"
            >
              <Menu className="h-5 w-5 text-indigo-600 dark:text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0 bg-card dark:bg-background border-indigo-200 dark:border-white/30">
            <ChatSidebar
              currentView={currentView}
              onViewChange={(view) => {
                handleViewChange(view)
                setIsSidebarOpen(false)
              }}
              selectedChat={selectedChat}
              onChatSelect={(chatId, chatInfo) => {
                handleChatSelect(chatId, chatInfo)
                setIsSidebarOpen(false)
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Desktop Left Sidebar */}
        <div className="hidden md:block w-80 border-r border-indigo-200 dark:border-white/30 bg-white dark:bg-background flex-shrink-0">
          <ChatSidebar
            currentView={currentView}
            onViewChange={handleViewChange}
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col w-full md:w-auto">
          <ChatMain
            key={selectedChat ?? "no-chat"} // stable key prevents message loss
            selectedChat={selectedChat}
            selectedChatInfo={selectedChatInfo}
            onContactInfoClick={() => setRightPanelView("contact-info")}
          />
        </div>

        {/* Right Panel */}
        {rightPanelView !== "none" && (
          <div className="w-80 border-l border-indigo-200 dark:border-white/30 bg-card dark:bg-background flex-shrink-0">
            <ChatRightPanel
              view={rightPanelView}
              selectedChat={selectedChat}
              selectedChatInfo={selectedChatInfo}
              onClose={() => setRightPanelView("none")}
            />
          </div>
        )}

        {/* Profile Modal */}
        <ProfileView
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      </div>
    </ChatsProvider>
  )
}

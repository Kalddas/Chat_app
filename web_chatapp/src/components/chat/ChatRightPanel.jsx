// File: src/components/chat/ChatRightPanel.jsx
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiscoveryView } from "./views/DiscoveryView"
import { RequestsView } from "./views/RequestsView"
import { SettingsView } from "./views/SettingsView"
import { ContactInfoView } from "./views/ContactInfoView"

export function ChatRightPanel({ view, selectedChat, selectedChatInfo, onClose }) {
  const getTitle = () => {
    switch (view) {
      case "discovery":
        return "Discovery"
      case "requests":
        return "Requests"
      case "settings":
        return "Settings"
      case "contact-info":
        return "Contact Info"
      default:
        return ""
    }
  }

  return (
    <div className="h-full flex flex-col bg-background dark:bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-indigo-200 dark:border-border bg-card dark:bg-card">
        <h2 className="text-lg font-semibold text-indigo-900 dark:text-foreground">{getTitle()}</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0 text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "discovery" && <DiscoveryView />}
        {view === "requests" && <RequestsView />}
        {view === "settings" && <SettingsView />}
        {view === "contact-info" && <ContactInfoView chatId={selectedChat} selectedChatInfo={selectedChatInfo} />}
      </div>
    </div>
  )
}
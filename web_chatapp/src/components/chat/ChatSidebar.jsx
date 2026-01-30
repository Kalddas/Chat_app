// File: src/components/chat/ChatSidebar.jsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { MessageCircle, Search, Users, UserPlus, User, Settings, MoreVertical, LogOut, Loader2, Sun, Moon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChatsView } from "./views/ChatsView"
import { DiscoveryView } from "./views/DiscoveryView"
import { RequestsView } from "./views/RequestsView"
import { ProfileView } from "./views/ProfileView"
import { SettingsView } from "./views/SettingsView"
import { useLogoutMutation } from "../../services/authService"
import { useGetUserProfileQuery } from "../../services/userService"
import { useTheme } from "@/contexts/ThemeContext"
import { NotificationBell } from "../NotificationBell"

export function ChatSidebar({ currentView, onViewChange, selectedChat, onChatSelect }) {
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetUserProfileQuery(undefined, {
    refetchOnMountOrArgChange: true, // Ensure fresh profile after login
  })
  const profile = profileData?.profile
  const { theme, setTheme } = useTheme()

  if (!user) return null

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      localStorage.removeItem("tokenType");
      localStorage.removeItem("user");
      logout();
      setShowLogoutDialog(false);
    }
  };

  const navigationItems = [
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "discovery", label: "Discovery", icon: Users },
    { id: "requests", label: "Requests", icon: UserPlus },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const renderView = () => {
    switch (currentView) {
      case "chats":
        return <ChatsView searchQuery={searchQuery} selectedChat={selectedChat} onChatSelect={onChatSelect} />
      case "discovery":
        return <DiscoveryView searchQuery={searchQuery} />
      case "requests":
        return <RequestsView />
      case "profile":
        return <ProfileView />
      case "settings":
        return <SettingsView />
      default:
        return <ChatsView searchQuery={searchQuery} selectedChat={selectedChat} onChatSelect={onChatSelect} />
    }
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-indigo-200 dark:border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {profileLoading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    <AvatarImage
                      src={(() => {
                        const profileSrc = profile?.profile_picture_url;
                        if (profileSrc) {
                          return `${profileSrc}${profileSrc.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
                        }
                        return null;
                      })()}
                      alt={profile?.first_name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                      }}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
                      {profile?.first_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>
              <div>
                {profileLoading ? (
                  <p className="text-sm text-indigo-600 dark:text-muted-foreground">Loading...</p>
                ) : profileError ? (
                  <p className="text-sm text-red-500 dark:text-red-400">Failed to load</p>
                ) : (
                  <>
                    <h2 className="font-semibold text-indigo-900 dark:text-foreground">{profile?.first_name} {profile?.last_name}</h2>
                    <p className="text-xs text-indigo-600 dark:text-muted-foreground">Online</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell userId={user?.id} isAdmin={false} />
              <Button
                variant="ghost"
                size="sm"
                className="text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card dark:bg-card border-indigo-200 dark:border-border">
                  <DropdownMenuItem
                    onClick={() => onViewChange("profile")}
                    className="text-indigo-700 dark:text-foreground focus:bg-indigo-100 dark:focus:bg-accent focus:text-indigo-900 dark:focus:text-foreground"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onViewChange("settings")}
                    className="text-indigo-700 dark:text-foreground focus:bg-indigo-100 dark:focus:bg-accent focus:text-indigo-900 dark:focus:text-foreground"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-indigo-200 dark:bg-border" />
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900 focus:text-red-900 dark:focus:text-red-100"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-500 dark:text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-indigo-300 dark:border-border focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500 dark:focus:ring-primary bg-white dark:bg-input text-gray-900 dark:text-foreground placeholder:text-gray-500 dark:placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="px-2 py-2 border-b border-indigo-200 dark:border-border">
          <div className="flex gap-1">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(item.id)}
                className={`flex-1 justify-center ${currentView === item.id
                  ? "bg-[#7B42F6] text-white hover:bg-[#7B42F6]/90"
                  : "text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
                  }`}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderView()}</div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md bg-card dark:bg-card border-indigo-200 dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-foreground">Confirm Logout</DialogTitle>
            <DialogDescription className="text-indigo-700 dark:text-muted-foreground">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isLoggingOut ? (
                <>
                  <LogOut className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
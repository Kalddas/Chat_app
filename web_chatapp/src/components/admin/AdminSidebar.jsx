import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, Users, FileText, Settings, Shield, LogOut, MoreVertical, User, Loader, Flag, MessageSquare } from "lucide-react"
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
import { useGetUserProfileQuery } from "../../services/userService"
import { useLogoutMutation } from "../../services/authService"
import { useNavigate } from "react-router-dom"

export function AdminSidebar({ currentView, onViewChange }) {
  const { data: profile, isLoading, error } = useGetUserProfileQuery()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { user, logout } = useAuth()
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("user");
      logout();
      setShowLogoutDialog(false);
      navigate("/login");
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "suspended-messages", label: "Suspended Messages", icon: MessageSquare },
    { id: "logs", label: "Action Logs", icon: FileText },
    { id: "settings", label: "Admin Settings", icon: Settings },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-indigo-200 dark:border-white/30">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-indigo-600 dark:text-primary" />
          <h1 className="text-lg font-bold text-indigo-900 dark:text-foreground">Admin Panel</h1>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 bg-indigo-100 dark:bg-card border-2 border-indigo-200 dark:border-white/30" key={profile?.profile?.profile_picture_url || 'no-image'}>
              <AvatarImage 
                src={
                  profile?.profile?.profile_picture_url 
                    ? `${profile.profile.profile_picture_url}${profile.profile.profile_picture_url.includes('?') ? '&' : '?'}t=${Date.now()}` 
                    : "/placeholder.svg"
                } 
                alt={profile?.profile?.first_name}
                onError={(e) => {
                  console.error("Avatar image load error:", e.target.src);
                  e.target.src = "/placeholder.svg";
                }}
              />
              <AvatarFallback className="text-indigo-700 dark:text-foreground">
                {profile?.profile?.first_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isLoading ? (
              <p className="text-indigo-600 dark:text-muted-foreground">
                <Loader className="animate-spin h-4 w-4" />
              </p>
            ) : (
              <p className="text-indigo-900 dark:text-foreground">
                {profile?.profile?.first_name} {profile?.profile?.last_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-foreground hover:text-indigo-800 dark:hover:text-foreground hover:bg-indigo-50 dark:hover:bg-accent">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-card border-indigo-200 dark:border-white/30">
                <DropdownMenuItem
                  onClick={() => setShowProfileDialog(true)}
                  className="text-indigo-900 dark:text-foreground focus:bg-indigo-50 dark:focus:bg-accent focus:text-indigo-900 dark:focus:text-foreground"
                >
                  <User className="mr-2 h-4 w-4 text-indigo-600 dark:text-primary" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onViewChange("settings")}
                  className="text-indigo-900 dark:text-foreground focus:bg-indigo-50 dark:focus:bg-accent focus:text-indigo-900 dark:focus:text-foreground"
                >
                  <Settings className="mr-2 h-4 w-4 text-indigo-600 dark:text-primary" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-indigo-200 dark:bg-white/30" />
                <DropdownMenuItem
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/30 focus:text-red-700 dark:focus:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              onClick={() => onViewChange(item.id)}
              className="w-full justify-start text-indigo-900 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent data-[state=default]:bg-primary data-[state=default]:text-white"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Logout Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-card border-indigo-200 dark:border-white/30">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-foreground">Confirm Logout</DialogTitle>
            <DialogDescription className="text-indigo-600 dark:text-muted-foreground">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="border-indigo-300 dark:border-white/30 text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
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

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-card border-indigo-200 dark:border-white/30">
          <DialogHeader>
            <DialogTitle className="text-indigo-900 dark:text-foreground">Profile</DialogTitle>
            <DialogDescription className="text-indigo-600 dark:text-muted-foreground">
              Your administrator account details
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 p-4">
            <Avatar className="h-16 w-16 border-2 border-indigo-200 dark:border-white/30" key={profile?.profile?.profile_picture_url || 'no-image'}>
              <AvatarImage 
                src={
                  profile?.profile?.profile_picture_url 
                    ? `${profile.profile.profile_picture_url}${profile.profile.profile_picture_url.includes('?') ? '&' : '?'}t=${Date.now()}` 
                    : "/placeholder.svg"
                } 
                alt={profile?.profile?.first_name}
                onError={(e) => {
                  console.error("Avatar image load error:", e.target.src);
                  e.target.src = "/placeholder.svg";
                }}
              />
              <AvatarFallback className="bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
                {profile?.profile?.first_name?.charAt(0)}
                {profile?.profile?.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold text-indigo-900 dark:text-foreground">
                {profile?.profile?.first_name} {profile?.profile?.last_name}
              </p>
              <p className="text-sm text-indigo-600 dark:text-muted-foreground">
                @{profile?.profile?.user_name}
              </p>
              <p className="text-sm text-indigo-600 dark:text-muted-foreground">
                {profile?.profile?.phone}
              </p>
              <p className="text-sm text-indigo-600 dark:text-muted-foreground">
                {profile?.profile?.bio}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

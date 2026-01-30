import { useState } from "react"
import { AdminSidebar } from "./AdminSidebar"
import { DashboardView } from "./views/DashboardView"
import { UserManagementView } from "./views/UserManagementView"
import { UserDetailsView } from "./views/UserDetailsView"
import { ActionLogsView } from "./views/ActionLogsView"
import { AdminSettingsView } from "./views/AdminSettingsView"
import { ReportsDashboard } from "./ReportsDashboard"
import { SuspendedMessagesView } from "./views/SuspendedMessagesView"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AdminLayout() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />
      case "users":
        return (
          <UserManagementView
            onUserSelect={(userId) => {
              setSelectedUserId(userId)
              setCurrentView("user-details")
            }}
          />
        )
      case "user-details":
        return <UserDetailsView userId={selectedUserId} onBack={() => setCurrentView("users")} />
      case "reports":
        return <ReportsDashboard />
      case "logs":
        return <ActionLogsView />
      case "suspended-messages":
        return <SuspendedMessagesView />
      case "settings":
        return <AdminSettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="h-screen bg-gradient-to-b from-indigo-50 to-purple-100 dark:bg-background flex relative">
      {/* Mobile Hamburger Button */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-background border border-indigo-200 dark:border-border shadow-md"
          >
            <Menu className="h-5 w-5 text-indigo-600 dark:text-foreground" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-background border-indigo-200 dark:border-border">
          <AdminSidebar 
            currentView={currentView} 
            onViewChange={(view) => {
              setCurrentView(view)
              setIsSidebarOpen(false)
            }} 
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r border-indigo-200 dark:border-border bg-white dark:bg-background flex-shrink-0">
        <AdminSidebar currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden w-full md:w-auto">{renderView()}</div>
    </div>
  )
}
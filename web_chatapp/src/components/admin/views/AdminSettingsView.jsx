
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/AuthContext"
import { Settings, Shield, Bell, Users } from "lucide-react"
import { useGetUserProfileQuery } from "../../../services/userService"

export function AdminSettingsView() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    autoModeration: true,
    emailNotifications: true,
    userRegistration: true,
    chatLogging: true,
    maxChatMembers: "50",
    sessionTimeout: "24",
    maintenanceMode: false,
  })
  const { data: profile, isLoading, error } = useGetUserProfileQuery()


  const [systemSettings, setSystemSettings] = useState({
    siteName: "Live flow",
    supportEmail: "support@chatapp.com",
    maintenanceMessage: "System is under maintenance. Please check back later.",
  })

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleSystemSettingChange = (key, value) => {
    setSystemSettings({ ...systemSettings, [key]: value })
  }

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    console.log("Saving settings:", { settings, systemSettings })
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-1rem)] overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-100 dark:bg-background">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-foreground">Admin Settings</h1>
        <p className="text-indigo-600 dark:text-muted-foreground">Configure system settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <Card className="border-indigo-200 dark:border-border dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-foreground">
              <Settings className="h-5 w-5 text-indigo-600 dark:text-primary" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-indigo-900 dark:text-foreground">Site Name</Label>
              <Input
                id="siteName"
                value={systemSettings.siteName}
                onChange={(e) => handleSystemSettingChange("siteName", e.target.value)}
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportEmail" className="text-indigo-900">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={systemSettings.supportEmail}
                onChange={(e) => handleSystemSettingChange("supportEmail", e.target.value)}
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceMessage" className="text-indigo-900">Maintenance Message</Label>
              <Textarea
                id="maintenanceMessage"
                value={systemSettings.maintenanceMessage}
                onChange={(e) => handleSystemSettingChange("maintenanceMessage", e.target.value)}
                rows={3}
                className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="maintenanceMode" className="text-indigo-900">Maintenance Mode</Label>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Moderation */}
        <Card className="border-indigo-200 dark:border-border dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Shield className="h-5 w-5 text-indigo-600" />
              Security & Moderation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoModeration" className="text-indigo-900">Auto Moderation</Label>
              <Switch
                id="autoModeration"
                checked={settings.autoModeration}
                onCheckedChange={(checked) => handleSettingChange("autoModeration", checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="chatLogging" className="text-indigo-900">Chat Logging</Label>
              <Switch
                id="chatLogging"
                checked={settings.chatLogging}
                onCheckedChange={(checked) => handleSettingChange("chatLogging", checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout" className="text-indigo-900">Session Timeout (hours)</Label>
              <Select
                value={settings.sessionTimeout}
                onValueChange={(value) => handleSettingChange("sessionTimeout", value)}
              >
                <SelectTrigger className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card border-indigo-200 dark:border-border">
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="border-indigo-200 dark:border-border dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Users className="h-5 w-5 text-indigo-600" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="userRegistration" className="text-indigo-900">Allow User Registration</Label>
              <Switch
                id="userRegistration"
                checked={settings.userRegistration}
                onCheckedChange={(checked) => handleSettingChange("userRegistration", checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxChatMembers" className="text-indigo-900">Max Chat Members</Label>
              <Select
                value={settings.maxChatMembers}
                onValueChange={(value) => handleSettingChange("maxChatMembers", value)}
              >
                <SelectTrigger className="border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-card border-indigo-200 dark:border-border">
                  <SelectItem value="10">10 members</SelectItem>
                  <SelectItem value="25">25 members</SelectItem>
                  <SelectItem value="50">50 members</SelectItem>
                  <SelectItem value="100">100 members</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-indigo-200 dark:border-border dark:bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Bell className="h-5 w-5 text-indigo-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications" className="text-indigo-900">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <Separator className="bg-indigo-200" />

            <div className="space-y-3">
              <h4 className="font-medium text-indigo-900">Admin Account</h4>
              <div className="space-y-2">
                <p className="text-sm text-indigo-600">
                  <span className="font-medium">Name:</span> {user?.name}
                </p>
                <p className="text-sm text-indigo-600">
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                <p className="text-sm text-indigo-600">
                  <span className="font-medium">Role:</span> Administrator
                </p>
              </div>
              <Button variant="outline" size="sm" className="border-indigo-300 text-indigo-700 hover:bg-indigo-50">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Card className="border-indigo-200">
        <CardContent className="pt-6">
          <Button onClick={handleSaveSettings} className="w-full bg-primary hover:bg-primary/90">
            Save All Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


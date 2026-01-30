
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/AuthContext"
import { Moon, Sun, Bell, Shield, Globe, Palette, SunMoon, Trash2 } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useExportChatsReportMutation } from "@/services/userService"
import ChangePasswordDialog from "@/components/ChangePasswordDialog"
import DeleteAccountDialog from "@/components/DeleteAccountDialog"

export function SettingsView() {
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    theme: "system",
    notifications: true,
    soundEnabled: true,
    readReceipts: true,
    onlineStatus: true,
    language: "en",
    chatTheme: "default",
  })
  const [exportChats, { isLoading: exporting, isSuccess: exportOk }] = useExportChatsReportMutation()
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)

  useEffect(() => {
    setSettings((s) => ({ ...s, theme }))
  }, [theme])

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-2rem)] overflow-y-auto bg-background dark:bg-background">

      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Palette className="h-4 w-4 text-indigo-600 dark:text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">Theme</Label>
            <Select value={settings.theme} onValueChange={(value) => { handleSettingChange("theme", value); setTheme(value) }}>
              <SelectTrigger className="w-32 border-indigo-300 dark:border-border dark:bg-input dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-border">
                <SelectItem value="system" className="dark:text-foreground">
                  <div className="flex items-center gap-2">
                    <SunMoon className="h-4 w-4" />
                    System
                  </div>
                </SelectItem>
                <SelectItem value="light" className="dark:text-foreground">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark" className="dark:text-foreground">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Dark
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>



        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Bell className="h-4 w-4 text-indigo-600 dark:text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">Push Notifications</Label>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">Sound Notifications</Label>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleSettingChange("soundEnabled", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Shield className="h-4 w-4 text-indigo-600 dark:text-primary" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">Read Receipts</Label>
            <Switch
              checked={settings.readReceipts}
              onCheckedChange={(checked) => handleSettingChange("readReceipts", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">Show Online Status</Label>
            <Switch
              checked={settings.onlineStatus}
              onCheckedChange={(checked) => handleSettingChange("onlineStatus", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <Separator className="bg-indigo-200 dark:bg-border" />

          <Button 
            variant="outline" 
            className="w-full bg-muted dark:bg-card border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
            onClick={() => setShowChangePasswordDialog(true)}
          >
            Change Password
          </Button>

          <Button variant="outline" className="w-full bg-white dark:bg-card border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent">
            Two-Factor Authentication
          </Button>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Globe className="h-4 w-4 text-indigo-600 dark:text-primary" />
            Language
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">Language</Label>
            <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
              <SelectTrigger className="w-32 border-indigo-300 dark:border-border dark:bg-input dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-border">
                <SelectItem value="en" className="dark:text-foreground">English</SelectItem>
                <SelectItem value="es" className="dark:text-foreground">Amharice</SelectItem>

              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base text-indigo-900 dark:text-foreground">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full bg-muted dark:bg-card border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
            disabled={exporting}
            onClick={() => exportChats()}
          >
            {exporting ? "Exporting..." : "Export Chat Data (send to admin)"}
          </Button>
          {exportOk && (
            <div className="text-green-600 dark:text-green-400 text-sm">Chat export sent to admin.</div>
          )}
          
          <Separator className="bg-indigo-200 dark:bg-border" />
          
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteAccountDialog(true)}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
          
          <Button variant="destructive" onClick={logout} className="w-full">
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        onPasswordChanged={() => {
          setShowChangePasswordDialog(false)
        }}
      />

      <DeleteAccountDialog
        open={showDeleteAccountDialog}
        onOpenChange={setShowDeleteAccountDialog}
      />
    </div>
  )
}
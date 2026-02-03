
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/AuthContext"
import { Moon, Sun, Bell, Shield, Globe, Palette, SunMoon, Trash2 } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useExportChatsReportMutation, useUpdateLanguageMutation, useGetUserProfileQuery } from "@/services/userService"
import ChangePasswordDialog from "@/components/ChangePasswordDialog"
import DeleteAccountDialog from "@/components/DeleteAccountDialog"
import { changeLanguage, AVAILABLE_LANGUAGES } from "@/i18n"

export function SettingsView() {
  const { t, i18n } = useTranslation()
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { data: profileData } = useGetUserProfileQuery()
  const [updateLanguage, { isLoading: updatingLanguage }] = useUpdateLanguageMutation()
  
  const [settings, setSettings] = useState({
    theme: "system",
    notifications: true,
    soundEnabled: true,
    readReceipts: true,
    onlineStatus: true,
    language: i18n.language || "en",
    chatTheme: "default",
  })
  const [exportChats, { isLoading: exporting, isSuccess: exportOk }] = useExportChatsReportMutation()
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)

  // Sync language from profile on load
  useEffect(() => {
    if (profileData?.profile?.language) {
      const userLang = profileData.profile.language
      setSettings((s) => ({ ...s, language: userLang }))
      if (i18n.language !== userLang) {
        changeLanguage(userLang)
      }
    }
  }, [profileData?.profile?.language, i18n.language])

  useEffect(() => {
    setSettings((s) => ({ ...s, theme }))
  }, [theme])

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value })
  }

  const handleLanguageChange = async (newLanguage) => {
    handleSettingChange("language", newLanguage)
    // Update i18n immediately for instant UI feedback
    changeLanguage(newLanguage)
    // Persist to backend
    try {
      await updateLanguage({ language: newLanguage }).unwrap()
    } catch (err) {
      console.error("Failed to update language:", err)
    }
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-2rem)] overflow-y-auto bg-background dark:bg-background">

      <Card className="border-indigo-200 dark:border-white/30 dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Palette className="h-4 w-4 text-indigo-600 dark:text-primary" />
            {t('settings.appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">{t('settings.theme')}</Label>
            <Select value={settings.theme} onValueChange={(value) => { handleSettingChange("theme", value); setTheme(value) }}>
              <SelectTrigger className="w-32 border-indigo-300 dark:border-white/30 dark:bg-input dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-white/30">
                <SelectItem value="system" className="dark:text-foreground">
                  <div className="flex items-center gap-2">
                    <SunMoon className="h-4 w-4" />
                    {t('settings.system')}
                  </div>
                </SelectItem>
                <SelectItem value="light" className="dark:text-foreground">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    {t('settings.light')}
                  </div>
                </SelectItem>
                <SelectItem value="dark" className="dark:text-foreground">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    {t('settings.dark')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-indigo-200 dark:border-white/30 dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Bell className="h-4 w-4 text-indigo-600 dark:text-primary" />
            {t('settings.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">{t('settings.pushNotifications')}</Label>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <Separator className="bg-indigo-200 dark:bg-white/30" />

          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">{t('settings.soundNotifications')}</Label>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => handleSettingChange("soundEnabled", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-indigo-200 dark:border-white/30 dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Shield className="h-4 w-4 text-indigo-600 dark:text-primary" />
            {t('settings.privacySecurity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">{t('settings.readReceipts')}</Label>
            <Switch
              checked={settings.readReceipts}
              onCheckedChange={(checked) => handleSettingChange("readReceipts", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <Separator className="bg-indigo-200 dark:bg-white/30" />

          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">{t('settings.showOnlineStatus')}</Label>
            <Switch
              checked={settings.onlineStatus}
              onCheckedChange={(checked) => handleSettingChange("onlineStatus", checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <Separator className="bg-indigo-200 dark:bg-white/30" />

          <Button 
            variant="outline" 
            className="w-full bg-muted dark:bg-card border-indigo-300 dark:border-white/30 text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
            onClick={() => setShowChangePasswordDialog(true)}
          >
            {t('auth.changePassword')}
          </Button>

          <Separator className="bg-indigo-200 dark:bg-white/30" />

          <Button variant="outline" className="w-full bg-white dark:bg-card border-indigo-300 dark:border-white/30 text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent">
            {t('auth.twoFactorAuth')}
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-indigo-200 dark:border-white/30 dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Globe className="h-4 w-4 text-indigo-600 dark:text-primary" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label className="text-indigo-900 dark:text-foreground">{t('settings.selectLanguage')}</Label>
            <Select 
              value={settings.language} 
              onValueChange={handleLanguageChange}
              disabled={updatingLanguage}
            >
              <SelectTrigger className="w-36 border-indigo-300 dark:border-white/30 dark:bg-input dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-white/30">
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="dark:text-foreground">
                    <span>{lang.nativeName}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="border-indigo-200 dark:border-white/30 dark:bg-card">
        <CardHeader className="">
          <CardTitle className="text-base text-indigo-900 dark:text-foreground">{t('settings.account')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full bg-muted dark:bg-card border-indigo-300 dark:border-white/30 text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
            disabled={exporting}
            onClick={() => exportChats()}
          >
            {exporting ? t('settings.exporting') : t('settings.exportChatData')}
          </Button>
          {exportOk && (
            <div className="text-green-600 dark:text-green-400 text-sm">{t('settings.exportSent')}</div>
          )}
          
          <Separator className="bg-indigo-200 dark:bg-white/30" />
          
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteAccountDialog(true)}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('settings.deleteAccount')}
          </Button>

          <Separator className="bg-indigo-200 dark:bg-white/30" />
          
          <Button variant="destructive" onClick={logout} className="w-full">
            {t('auth.signOut')}
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

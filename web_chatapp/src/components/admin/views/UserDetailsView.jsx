
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserX, UserMinus, UserCheck, Clock } from "lucide-react"
import { DEMO_USERS } from "@/contexts/auth-context"


export function UserDetailsView({ userId, onBack }) {
  const [actionType, setActionType] = useState("")
  const [reason, setReason] = useState("")
  const [suspensionDays, setSuspensionDays] = useState("7")

  const user = DEMO_USERS.find((u) => u.id === userId)

  if (!user) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4 bg-transparent">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const handleAction = () => {
    if (!actionType || !reason.trim()) return
    console.log("Admin action:", { actionType, reason, suspensionDays, userId })
    setActionType("")
    setReason("")
    setSuspensionDays("7")
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case "suspended":
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case "banned":
        return <Badge variant="destructive">Banned</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString() + " " + new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-1rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Details</h1>
          <p className="text-muted-foreground">Manage user account and permissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                {getStatusBadge(user.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Registration Date</Label>
                <p className="text-foreground">{new Date(user.registrationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Last Active</Label>
                <p className="text-foreground">{formatDate(user.lastActive)}</p>
              </div>
            </div>

            {user.suspensionExpiry && (
              <div>
                <Label className="text-muted-foreground">Suspension Expires</Label>
                <p className="text-foreground">{formatDate(user.suspensionExpiry)}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Interests</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {user.interests?.map((interest) => (
                  <Badge key={interest} variant="secondary">{interest}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  {user.status === "active" && (
                    <>
                      <SelectItem value="suspend">
                        <div className="flex items-center gap-2">
                          <UserMinus className="h-4 w-4" /> Suspend User
                        </div>
                      </SelectItem>
                      <SelectItem value="ban">
                        <div className="flex items-center gap-2">
                          <UserX className="h-4 w-4" /> Ban User
                        </div>
                      </SelectItem>
                    </>
                  )}
                  {user.status === "suspended" && (
                    <SelectItem value="restore">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Restore User
                      </div>
                    </SelectItem>
                  )}
                  {user.status === "banned" && (
                    <SelectItem value="unban">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" /> Unban User
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {actionType === "suspend" && (
              <div className="space-y-2">
                <Label htmlFor="suspensionDays">Suspension Duration (Days)</Label>
                <Input
                  id="suspensionDays"
                  type="number"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  min="1"
                  max="365"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleAction} disabled={!actionType || !reason.trim()} className="w-full">
              Execute Action
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Action History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Action History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No actions recorded for this user</p>
          ) : (
            <div className="space-y-3">
              {actionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-medium text-foreground capitalize">{log.action} Action</p>
                    <p className="text-sm text-muted-foreground">By {log.adminName}</p>
                    {log.reason && <p className="text-sm text-muted-foreground">Reason: {log.reason}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatDate(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText } from "lucide-react"
import { useGetActionLogsQuery } from "@/services/adminService"

// Map backend logs to UI rows
function mapAction(log) {
  const to = log?.details?.to;
  if (!to) return log?.action || "change";
  const t = String(to).toLowerCase();
  if (t === "suspended") return "suspend";
  if (t === "banned") return "ban";
  if (t === "active" || t === "pending") return "restore";
  return "change";
}

function getActionText(action, details) {
  const to = details?.to;
  if (!to) return action;
  const t = String(to).toLowerCase();
  if (t === "suspended") return "suspended";
  if (t === "banned") return "banned";
  if (t === "active" || t === "pending") return "restored";
  return action;
}

export function ActionLogsView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const { data, isLoading } = useGetActionLogsQuery()

  const logs = useMemo(() => {
    const items = data?.action_logs || []
    return items.map((l) => ({
      id: l.id,
      adminId: l.admin?.id ?? "-",
      adminName: l.admin?.email ?? "Admin",
      action: mapAction(l),
      actionText: getActionText(l.action, l.details),
      targetUserId: l.target_user?.id ?? "-",
      targetUserName: l.target_user?.email ?? "User",
      timestamp: l.created_at,
      reason: l.details?.reason || l.description || "",
    }))
  }, [data])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      String(log.adminName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.targetUserName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.reason && String(log.reason).toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesAction = actionFilter === "all" || log.action === actionFilter
    return matchesSearch && matchesAction
  })

  const getActionBadge = (action) => {
    switch (action) {
      case "ban":
        return <Badge variant="destructive">Ban</Badge>
      case "suspend":
        return (
          <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
            Suspend
          </Badge>
        )
      case "restore":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Restore
          </Badge>
        )
      case "unban":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Unban
          </Badge>
        )
      default:
        return <Badge variant="secondary">{action}</Badge>
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr || "")
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-1rem)] overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-100 dark:bg-background">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-foreground">Action Logs</h1>
        <p className="text-indigo-600 dark:text-muted-foreground">Track all administrative actions</p>
      </div>

      {/* Filters */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <Search className="h-5 w-5 text-indigo-600 dark:text-primary" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-indigo-600 dark:text-muted-foreground" />
                <Input
                  placeholder="Search by admin, user, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-indigo-300 dark:border-border dark:bg-input dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40 border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-card border-indigo-200 dark:border-border">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="ban">Ban</SelectItem>
                <SelectItem value="suspend">Suspend</SelectItem>
                <SelectItem value="restore">Restore</SelectItem>
                <SelectItem value="unban">Unban</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-primary" />
            Action History ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-indigo-600 dark:text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-indigo-600 dark:text-muted-foreground text-center py-8">No action logs found</p>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border border-indigo-200 dark:border-border rounded-lg bg-white dark:bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getActionBadge(log.action)}
                      <span className="font-medium text-indigo-900 dark:text-foreground">
                        {log.adminName} {log.actionText} {log.targetUserName}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-indigo-600 dark:text-muted-foreground">
                      <div>
                        <span className="font-medium dark:text-foreground">Admin ID:</span> {log.adminId}
                      </div>
                      <div>
                        <span className="font-medium dark:text-foreground">Target User ID:</span> {log.targetUserId}
                      </div>
                      <div>
                        <span className="font-medium">Timestamp:</span> {formatDate(log.timestamp)}
                      </div>
                    </div>

                    {log.reason && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-indigo-600">Reason:</span>
                        <p className="text-sm text-indigo-900 mt-1">{log.reason}</p>
                      </div>
                    )}
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


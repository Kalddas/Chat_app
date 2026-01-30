

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, UserMinus, MessageCircle, TrendingUp } from "lucide-react"
import { useGetAllUserQuery, useGetDashboardResultQuery } from "../../../services/adminService"

export function DashboardView() {
  const { data, isLoading, error } = useGetDashboardResultQuery()
  console.log(data)
  const {
    data: allData
  } = useGetAllUserQuery(1)
  console.log(allData)
  if (isLoading) {
    return <div className="p-4 text-sm text-indigo-600 dark:text-muted-foreground">Loading dashboard...</div>
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500 dark:text-red-400">Failed to load dashboard</div>
  }

  // ✅ use API response
  const totalUsers = data?.total_users || 0
  const activeUsers = data?.active_users || 0
  const onlineUsers = data?.online_users || 0
  const pendingReports = data?.pending_reports || 0

  const stats = [
    {
      title: "Total Registered Users",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      title: "Active Users",
      value: activeUsers,
      icon: UserCheck,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/30",
    },
    {
      title: "Online Users",
      value: onlineUsers,
      icon: MessageCircle,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/30",
    },
    {
      title: "Pending Reports",
      value: pendingReports,
      icon: UserMinus,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
    },
  ]

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-1rem)] overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-100 dark:bg-background">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-indigo-900 dark:text-foreground">Dashboard</h1>
        <p className="text-indigo-600 dark:text-muted-foreground">Overview of your chat application</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-indigo-200 dark:border-border dark:bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600 dark:text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-foreground">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Active Users */}
      <Card className="border-indigo-200 dark:border-border dark:bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900 dark:text-foreground">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-primary" />
            Recent Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recent_active_users?.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 dark:bg-card dark:border dark:border-border">
                <div>
                  <p className="font-medium text-indigo-900 dark:text-foreground">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-sm text-indigo-600 dark:text-muted-foreground">{user.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="mb-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">active</Badge>
                  <p className="text-xs text-indigo-600 dark:text-muted-foreground">{user.last_active}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
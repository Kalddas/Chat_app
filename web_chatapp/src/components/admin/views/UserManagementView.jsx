import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Filter, Eye, Trash2, ArrowLeft } from "lucide-react"
import {
  useSearchUserQuery,
  useUpdateUserStatusMutation,
  useRemoveUserMutation,
  useGetAllUserQuery
} from "../../../services/adminService"

export function UserManagementView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [userToUpdateStatus, setUserToUpdateStatus] = useState(null)
  const [newStatus, setNewStatus] = useState("")
  const [currentPage, setCurrentPage] = useState(1) // <-- current page

  const isSearching = searchQuery.trim().length > 0

  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    refetch: refetchSearch,
  } = useSearchUserQuery(searchQuery, { skip: !isSearching })

  const {
    data: allData,
    isLoading: isAllLoading,
    error: allError,
    refetch: refetchAll,
  } = useGetAllUserQuery(currentPage) // fetch users by page

  const [updateUserStatus] = useUpdateUserStatusMutation()
  const [removeUser] = useRemoveUserMutation()

  const data = isSearching ? searchData : allData
  const isLoading = isSearching ? isSearchLoading : isAllLoading
  const error = isSearching ? searchError : allError
  const refetch = isSearching ? refetchSearch : refetchAll

  const users = data?.users || []
  const pagination = data?.pagination || { current_page: 1, total_pages: 1 }


  const filteredUsers = users?.filter((user) => {
    return statusFilter === "all" || user.status?.toLowerCase() === statusFilter
  })

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "suspended":
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case "banned":
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  const confirmStatusChange = (userId, status) => {
    setUserToUpdateStatus(userId)
    setNewStatus(status)
  }

  const executeStatusChange = async () => {
    try {
      await updateUserStatus({ id: userToUpdateStatus, status: newStatus }).unwrap()
      refetch()
    } catch (err) {
      console.error("Failed to update status", err)
    } finally {
      setUserToUpdateStatus(null)
      setNewStatus("")
    }
  }

  const confirmRemoveUser = (userId) => {
    setUserToDelete(userId)
  }

  const executeRemoveUser = async () => {
    try {
      await removeUser(userToDelete).unwrap()
      refetch()
    } catch (err) {
      console.error("Failed to remove user", err)
    } finally {
      setUserToDelete(null)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToNextPage = () => {
    if (currentPage < pagination.total_pages) setCurrentPage(currentPage + 1)
  }

  if (selectedUserId) {
    return <UserDetailsView userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-1rem)] overflow-y-auto bg-gradient-to-b from-indigo-50 to-purple-100 dark:bg-background">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage and monitor user accounts</p>
      </div>

      {/* Filters */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-foreground">
            <Filter className="h-5 w-5" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-input dark:text-foreground dark:border-border"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 dark:bg-input dark:text-foreground dark:border-border">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-card dark:border-border">
                <SelectItem value="all" className="dark:text-foreground">All Status</SelectItem>
                <SelectItem value="active" className="dark:text-foreground">Active</SelectItem>
                <SelectItem value="suspended" className="dark:text-foreground">Suspended</SelectItem>
                <SelectItem value="banned" className="dark:text-foreground">Banned</SelectItem>
                <SelectItem value="pending" className="dark:text-foreground">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="dark:bg-card dark:border-border">
        <CardHeader>
          <CardTitle className="dark:text-foreground">Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
          {error && <p className="text-sm text-red-500">Failed to load users</p>}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Registered</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder.svg" alt={user.first_name} />
                            <AvatarFallback>{user.first_name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.first_name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.join_date ? new Date(user.join_date).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Select onValueChange={(val) => confirmStatusChange(user.id, val)}>
                            <SelectTrigger className="w-[110px] text-xs">
                              <SelectValue placeholder="Set Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                              <SelectItem value="banned">Banned</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                            variant="outline"
                            className="dark:bg-card dark:border-border dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent hover:text-indigo-500 dark:hover:text-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmRemoveUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between mt-4">
            <Button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <p className="text-sm text-muted-foreground">
              Page {pagination.current_page} of {pagination.total_pages}
            </p>
            <Button
              onClick={goToNextPage}
              disabled={currentPage === pagination.total_pages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent className="bg-red-50 dark:bg-card border-2 border-red-300 dark:border-red-800 rounded-xl shadow-lg">
          <DialogHeader className="text-red-700 dark:text-red-400">
            <DialogTitle className="text-xl font-bold text-red-800 dark:text-red-300">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-red-600 dark:text-red-200">
              Are you sure you want to delete this user account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserToDelete(null)} className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30">
              Cancel
            </Button>
            <Button variant="destructive" onClick={executeRemoveUser} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={!!userToUpdateStatus} onOpenChange={() => setUserToUpdateStatus(null)}>
        <DialogContent className="bg-indigo-50 dark:bg-card border-2 border-indigo-300 dark:border-border rounded-xl shadow-lg">
          <DialogHeader className="text-indigo-700 dark:text-foreground">
            <DialogTitle className="text-xl font-bold text-indigo-800 dark:text-foreground">Confirm Status Change</DialogTitle>
            <DialogDescription className="text-indigo-600 dark:text-muted-foreground">
              Are you sure you want to change this user's status to {newStatus}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUserToUpdateStatus(null)} className="border-indigo-300 dark:border-border text-indigo-700 dark:text-foreground hover:bg-indigo-100 dark:hover:bg-accent">
              Cancel
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white" onClick={executeStatusChange}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

function UserDetailsView({ userId, onBack }) {
  const {
    data: allData,
    isLoading: isAllLoading,
  } = useGetAllUserQuery()

  const user = allData?.users?.find(u => u.id === userId)

  if (!user) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "suspended":
        return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>
      case "banned":
        return <Badge className="bg-red-100 text-red-800">Banned</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>
    }
  }

  return (
    <div className="p-4 space-y-4 h-[calc(100vh-1rem)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-foreground">User Details</h1>
          <p className="text-muted-foreground">Manage user account and permissions</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
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
                <AvatarImage src="/placeholder.svg" alt={user.first_name} />
                <AvatarFallback className="text-lg">{user.first_name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{user.first_name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                {getStatusBadge(user.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Registration Date</p>
                <p className="text-foreground">{user.join_date ? new Date(user.join_date).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Active</p>
                <p className="text-foreground">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">User ID</p>
              <p className="text-foreground">{user.id}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Message Count</p>
              <p className="text-foreground">{user.message_count || 0}</p>
            </div>
          </CardContent>
        </Card>

        {/* Admin Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Use the main user management table to modify this user's status or perform other administrative actions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
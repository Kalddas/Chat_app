import { useAuth } from "../../contexts/AuthContext"
import { useEffect } from "react"
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom"
import { AdminLayout } from "../../components/admin/AdminLayout"
export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      router("/login")
    } else if (user && user.role !== "admin") {
      router("/chat")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return <AdminLayout />
}

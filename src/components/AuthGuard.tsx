
import { useAuth } from '@/hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user" | "technician" | "admin_tech"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Show loading skeleton only when necessary
  if (loading && !user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    )
  }

  // Redirect to login if no user or profile
  if (!user || !profile) {
    if (location.pathname !== '/') {
      return <Navigate to="/" state={{ from: location }} replace />
    }
    return <>{children}</>
  }

  // Role-based access control
  if (requiredRole) {
    if (requiredRole === "admin_tech") {
      if (profile.role !== "admin" && profile.role !== "technician") {
        return <Navigate to="/user-dashboard" replace />
      }
    } else if (profile.role !== requiredRole) {
      // Redirect logic based on user role
      if (profile.role === 'admin' && requiredRole === 'user') {
        return <Navigate to="/" replace />
      }
      if (profile.role === 'technician' && requiredRole === 'user') {
        return <Navigate to="/" replace />
      }
      if (profile.role === 'user' && (requiredRole === 'admin' || requiredRole === 'technician')) {
        return <Navigate to="/user-dashboard" replace />
      }
    }
  }

  return <>{children}</>
}

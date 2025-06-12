
import { useAuth } from '@/hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "user" | "technician" | "admin_tech"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole) {
    // admin_tech means both admin and technician can access
    if (requiredRole === "admin_tech") {
      if (profile.role !== "admin" && profile.role !== "technician") {
        return <Navigate to="/user-portal" replace />
      }
    } else if (profile.role !== requiredRole) {
      // Se é admin ou técnico tentando acessar área de usuário, redireciona para dashboard
      if ((profile.role === 'admin' || profile.role === 'technician') && requiredRole === 'user') {
        return <Navigate to="/" replace />
      }
      // Se é usuário tentando acessar área de admin/técnico, redireciona para portal do usuário
      if (profile.role === 'user' && (requiredRole === 'admin' || requiredRole === 'technician')) {
        return <Navigate to="/user-portal" replace />
      }
    }
  }

  return <>{children}</>
}

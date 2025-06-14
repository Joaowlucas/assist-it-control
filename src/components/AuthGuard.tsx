
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

  // Mostrar loading apenas se realmente necessário
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

  // Se não há usuário ou perfil, redirecionar para login preservando a rota atual
  if (!user || !profile) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" state={{ from: location }} replace />
    }
    return <>{children}</>
  }

  // Verificar permissões de role
  if (requiredRole) {
    // admin_tech significa que tanto admin quanto technician podem acessar
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

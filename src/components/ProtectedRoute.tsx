
import { ReactNode } from "react"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: "admin" | "user"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const currentUserStr = localStorage.getItem('currentUser')
  
  if (!currentUserStr) {
    return <Navigate to="/login" replace />
  }

  const currentUser = JSON.parse(currentUserStr)
  
  if (requiredRole && currentUser.role !== requiredRole) {
    // Se é admin tentando acessar área de usuário, redireciona para dashboard
    if (currentUser.role === 'admin' && requiredRole === 'user') {
      return <Navigate to="/" replace />
    }
    // Se é usuário tentando acessar área de admin, redireciona para portal do usuário
    if (currentUser.role === 'user' && requiredRole === 'admin') {
      return <Navigate to="/user-portal" replace />
    }
  }

  return <>{children}</>
}

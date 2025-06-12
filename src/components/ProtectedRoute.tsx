
import { ReactNode } from "react"
import { Navigate } from "react-router-dom"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: "admin" | "user" | "technician" | "admin_tech"
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const currentUserStr = localStorage.getItem('currentUser')
  
  if (!currentUserStr) {
    return <Navigate to="/login" replace />
  }

  const currentUser = JSON.parse(currentUserStr)
  
  if (requiredRole) {
    // admin_tech means both admin and technician can access
    if (requiredRole === "admin_tech") {
      if (currentUser.role !== "admin" && currentUser.role !== "technician") {
        return <Navigate to="/user-portal" replace />
      }
    } else if (currentUser.role !== requiredRole) {
      // Se é admin ou técnico tentando acessar área de usuário, redireciona para dashboard
      if ((currentUser.role === 'admin' || currentUser.role === 'technician') && requiredRole === 'user') {
        return <Navigate to="/" replace />
      }
      // Se é usuário tentando acessar área de admin/técnico, redireciona para portal do usuário
      if (currentUser.role === 'user' && (requiredRole === 'admin' || requiredRole === 'technician')) {
        return <Navigate to="/user-portal" replace />
      }
    }
  }

  return <>{children}</>
}

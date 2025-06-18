
import { useAuth } from "@/hooks/useAuth"
import { Navigate } from "react-router-dom"

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

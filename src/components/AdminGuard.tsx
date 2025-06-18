
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { profile } = useAuth()
  
  if (!profile) {
    return <Navigate to="/login" replace />
  }
  
  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

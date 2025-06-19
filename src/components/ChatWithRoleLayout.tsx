
import { useAuth } from '@/hooks/useAuth'
import { AdminLayout } from '@/components/AdminLayout'
import { UserLayout } from '@/components/UserLayout'
import Chat from '@/pages/Chat'

export function ChatWithRoleLayout() {
  const { profile } = useAuth()

  // Se é usuário, usa UserLayout
  if (profile?.role === 'user') {
    return (
      <UserLayout>
        <Chat />
      </UserLayout>
    )
  }

  // Se é admin ou técnico, usa AdminLayout
  return (
    <AdminLayout>
      <Chat />
    </AdminLayout>
  )
}

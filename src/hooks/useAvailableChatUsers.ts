
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface AvailableChatUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  unit_id: string | null
  avatar_url: string | null
  unit_name: string | null
}

export function useAvailableChatUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-chat-users-final', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching available chat users for user:', profile.id, 'role:', profile.role)

      const { data, error } = await supabase.rpc('get_available_chat_users_final', {
        requesting_user_id: profile.id
      })

      if (error) {
        console.error('Error fetching available users:', error)
        throw error
      }

      console.log('Available users fetched successfully:', data?.length || 0, 'users')
      return (data as AvailableChatUser[]) || []
    },
    enabled: !!profile?.id,
  })
}

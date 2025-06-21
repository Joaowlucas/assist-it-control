
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
  unit_name?: string
}

export function useAvailableChatUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-chat-users', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching available users for chat using new safe function')

      // Usar a nova função SECURITY DEFINER sem parâmetros
      const { data, error } = await supabase.rpc('get_chat_available_users')

      if (error) {
        console.error('Error fetching available users:', error)
        throw error
      }

      console.log('Available users fetched:', data?.length || 0, 'users')
      return (data as AvailableChatUser[]) || []
    },
    enabled: !!profile?.id,
  })
}

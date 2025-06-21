
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useExistingPrivateChat(userId1?: string, userId2?: string) {
  return useQuery({
    queryKey: ['existing-private-chat', userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return null

      const { data, error } = await supabase.rpc('find_existing_private_chat', {
        user1_id: userId1,
        user2_id: userId2
      })

      if (error) {
        console.error('Error checking existing chat:', error)
        return null
      }

      return data as string | null
    },
    enabled: !!userId1 && !!userId2,
  })
}

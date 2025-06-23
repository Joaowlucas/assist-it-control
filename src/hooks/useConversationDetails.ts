
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useConversationDetails(conversationId: string) {
  const { data: conversation, isLoading: loading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants (
            user_id,
            role,
            profiles (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('id', conversationId)
        .single()

      if (error) {
        console.error('Error fetching conversation:', error)
        throw error
      }

      return {
        ...data,
        participants: data.conversation_participants.map((p: any) => p.profiles)
      }
    },
    enabled: !!conversationId
  })

  return { conversation, loading }
}

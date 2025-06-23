
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface CreateConversationParams {
  type: 'direct' | 'group'
  name?: string
  description?: string
  participantIds: string[]
  unitId?: string
}

export function useCreateConversation() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (params: CreateConversationParams) => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { type, name, description, participantIds, unitId } = params

      // Check if direct conversation already exists
      if (type === 'direct' && participantIds.length === 1) {
        const { data: existing } = await supabase
          .from('conversations')
          .select(`
            id,
            conversation_participants!inner (user_id)
          `)
          .eq('type', 'direct')
          .eq('unit_id', unitId)

        const existingConv = existing?.find(conv => {
          const userIds = conv.conversation_participants.map(p => p.user_id)
          return userIds.length === 2 && 
                 userIds.includes(profile.id) && 
                 userIds.includes(participantIds[0])
        })

        if (existingConv) {
          return existingConv
        }
      }

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type,
          name,
          description,
          unit_id: unitId,
          created_by: profile.id
        })
        .select()
        .single()

      if (convError) throw convError

      // Add participants
      const participants = [
        { conversation_id: conversation.id, user_id: profile.id, role: 'admin' },
        ...participantIds.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member'
        }))
      ]

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      return conversation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  return {
    createConversation: mutation.mutate,
    loading: mutation.isPending
  }
}


import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from '@/hooks/use-toast'

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
      if (!profile?.id) {
        console.error('User not authenticated')
        throw new Error('User not authenticated')
      }

      const { type, name, description, participantIds, unitId } = params
      
      console.log('Creating conversation with params:', {
        type,
        name,
        participantIds,
        unitId,
        currentUserId: profile.id
      })

      // Para conversas diretas, verificar se já existe uma conversa entre os dois usuários
      if (type === 'direct' && participantIds.length === 1) {
        console.log('Checking for existing direct conversation...')
        
        const { data: existingConversations, error: searchError } = await supabase
          .from('conversations')
          .select(`
            id,
            conversation_participants!inner (
              user_id
            )
          `)
          .eq('type', 'direct')
          .eq('unit_id', unitId)
          .eq('is_active', true)

        if (searchError) {
          console.error('Error searching for existing conversations:', searchError)
        } else if (existingConversations) {
          console.log('Found existing conversations:', existingConversations)
          
          // Verificar se existe uma conversa com exatamente os mesmos participantes
          for (const conv of existingConversations) {
            const userIds = conv.conversation_participants.map((p: any) => p.user_id)
            const expectedUserIds = [profile.id, participantIds[0]].sort()
            const actualUserIds = userIds.sort()
            
            if (expectedUserIds.length === actualUserIds.length &&
                expectedUserIds.every((id, index) => id === actualUserIds[index])) {
              console.log('Found existing direct conversation:', conv.id)
              return { id: conv.id }
            }
          }
        }
      }

      console.log('Creating new conversation...')

      // Criar a conversa
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

      if (convError) {
        console.error('Error creating conversation:', convError)
        throw convError
      }

      console.log('Conversation created:', conversation)

      // Preparar participantes: incluir o criador e os participantes selecionados
      const participants = [
        { 
          conversation_id: conversation.id, 
          user_id: profile.id, 
          role: 'admin' 
        },
        ...participantIds.map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member'
        }))
      ]

      console.log('Adding participants:', participants)

      // Adicionar participantes
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants)

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
        
        // Se falhar ao adicionar participantes, remover a conversa criada
        await supabase
          .from('conversations')
          .delete()
          .eq('id', conversation.id)
        
        throw participantsError
      }

      console.log('Conversation created successfully:', conversation)
      return conversation
    },
    onSuccess: (data) => {
      console.log('Conversation creation mutation successful:', data)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      
      toast({
        title: "Sucesso",
        description: "Conversa criada com sucesso!"
      })
    },
    onError: (error) => {
      console.error('Conversation creation failed:', error)
      
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa. Tente novamente.",
        variant: "destructive"
      })
    }
  })

  return {
    createConversation: mutation.mutate,
    loading: mutation.isPending
  }
}

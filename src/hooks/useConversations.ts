import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  unit_id?: string
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  description?: string
  avatar_url?: string
  participants: Array<{
    id: string
    user_id: string
    role: string
    user: {
      name: string
      avatar_url?: string
      role: string
    }
  }>
  last_message?: {
    id: string
    content?: string
    created_at: string
    sender: {
      name: string
    }
    message_type: string
  }
  unread_count: number
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const fetchConversations = async () => {
    if (!user || !profile) return

    try {
      // Buscar conversas que o usuário participa
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(
            id,
            name,
            type,
            unit_id,
            created_by,
            created_at,
            updated_at,
            is_active,
            description,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('conversations.is_active', true)
        .is('left_at', null)

      if (participantError) throw participantError

      const conversationIds = participantData.map(p => p.conversation_id)

      if (conversationIds.length === 0) {
        setConversations([])
        return
      }

      // Buscar participantes de cada conversa
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          role,
          profiles!inner(
            name,
            avatar_url,
            role
          )
        `)
        .in('conversation_id', conversationIds)
        .is('left_at', null)

      if (allParticipantsError) throw allParticipantsError

      // Buscar última mensagem de cada conversa
      const { data: lastMessages, error: lastMessagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          conversation_id,
          content,
          message_type,
          created_at,
          profiles!inner(name)
        `)
        .in('conversation_id', conversationIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (lastMessagesError) throw lastMessagesError

      // Organizar dados
      const conversationsWithData = participantData.map(p => {
        const conversation = p.conversations
        const participants = allParticipants
          .filter(ap => ap.conversation_id === conversation.id)
          .map(ap => ({
            id: ap.id,
            user_id: ap.user_id,
            role: ap.role,
            user: {
              name: ap.profiles.name,
              avatar_url: ap.profiles.avatar_url,
              role: ap.profiles.role
            }
          }))

        const lastMessage = lastMessages.find(lm => lm.conversation_id === conversation.id)

        return {
          ...conversation,
          participants,
          last_message: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            message_type: lastMessage.message_type,
            sender: {
              name: lastMessage.profiles.name
            }
          } : undefined,
          unread_count: 0 // TODO: Implementar contagem de não lidas
        }
      })

      // Ordenar por última atividade
      conversationsWithData.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.updated_at
        const bTime = b.last_message?.created_at || b.updated_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setConversations(conversationsWithData)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as conversas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [user, profile])

  // Configurar realtime
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants'
        },
        () => {
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const createConversation = async (participantIds: string[], name?: string, type: 'direct' | 'group' = 'direct') => {
    if (!user || !profile) throw new Error('Usuário não autenticado')

    try {
      // Criar conversa
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          name,
          type,
          unit_id: profile.unit_id,
          created_by: user.id,
        })
        .select()
        .single()

      if (conversationError) throw conversationError

      // Adicionar participantes (incluindo o criador)
      const allParticipants = [...new Set([user.id, ...participantIds])]
      const participantsData = allParticipants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: userId === user.id ? 'creator' : 'member'
      }))

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantsData)

      if (participantsError) throw participantsError

      await fetchConversations()
      return conversation.id
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a conversa",
        variant: "destructive",
      })
      throw error
    }
  }

  return {
    conversations,
    loading,
    createConversation,
    refetch: fetchConversations
  }
}
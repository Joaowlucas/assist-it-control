
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export interface Conversation {
  id: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
  last_message_at: string
  participants?: ConversationParticipant[]
  last_message?: {
    id: string
    content: string
    created_at: string
    sender_id: string
    sender_name: string
  }
}

export interface ConversationParticipant {
  id: string
  user_id: string
  conversation_id: string
  joined_at: string
  profiles: {
    id: string
    name: string
    avatar_url?: string
    role: string
  }
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  edited_at?: string
  is_deleted: boolean
  attachment_url?: string
  attachment_name?: string
  attachment_type?: string
  attachment_size?: number
  profiles: {
    id: string
    name: string
    avatar_url?: string
    role: string
  }
}

export interface UnitUser {
  id: string
  name: string
  email: string
  role: string
  unit_id: string
  avatar_url?: string
  unit_name: string
}

// Hook para buscar conversas do usuário
export function useConversations() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['conversations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching conversations for user:', profile.id)

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          created_by,
          created_at,
          updated_at,
          last_message_at,
          participants:conversation_participants(
            id,
            user_id,
            joined_at,
            profiles(id, name, avatar_url, role)
          )
        `)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        throw error
      }

      console.log('Conversations fetched:', data?.length || 0)
      return (data as Conversation[]) || []
    },
    enabled: !!profile?.id,
  })

  // Real-time updates
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          console.log('Conversations changed, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_participants',
        },
        () => {
          console.log('Participants changed, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  return query
}

// Hook para buscar mensagens de uma conversa
export function useMessages(conversationId?: string) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []

      console.log('Fetching messages for conversation:', conversationId)

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at,
          updated_at,
          edited_at,
          is_deleted,
          attachment_url,
          attachment_name,
          attachment_type,
          attachment_size,
          profiles(id, name, avatar_url, role)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      console.log('Messages fetched:', data?.length || 0)
      return (data as Message[]) || []
    },
    enabled: !!conversationId && !!profile?.id,
  })

  // Real-time updates para mensagens
  useEffect(() => {
    if (!conversationId || !profile?.id) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          console.log('New message received, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          console.log('Message updated, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, profile?.id, queryClient])

  return query
}

// Hook para buscar usuários da mesma unidade
export function useUnitUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['unit-users', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching unit users')

      const { data, error } = await supabase.rpc('get_unit_users')

      if (error) {
        console.error('Error fetching unit users:', error)
        throw error
      }

      console.log('Unit users fetched:', data?.length || 0)
      return (data as UnitUser[]) || []
    },
    enabled: !!profile?.id,
  })
}

// Hook para criar nova conversa
export function useCreateConversation() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      name: string
      participantId: string
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      console.log('Creating conversation:', params)

      // Verificar se já existe conversa entre os dois usuários
      const { data: existingConversation } = await supabase.rpc('find_existing_conversation', {
        user1_id: profile.id,
        user2_id: params.participantId
      })

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation)
        return existingConversation
      }

      // Criar nova conversa
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert([{
          name: params.name,
          created_by: profile.id,
        }])
        .select('id')
        .single()

      if (conversationError) {
        console.error('Error creating conversation:', conversationError)
        throw conversationError
      }

      // Adicionar participantes
      const participantData = [
        { conversation_id: conversation.id, user_id: profile.id },
        { conversation_id: conversation.id, user_id: params.participantId }
      ]

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert(participantData)

      if (participantError) {
        console.error('Error adding participants:', participantError)
        throw participantError
      }

      console.log('Conversation created successfully:', conversation.id)
      return conversation.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Hook para enviar mensagem
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      conversationId: string
      content: string
      attachmentFile?: File
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      console.log('Sending message to conversation:', params.conversationId)

      let attachmentUrl, attachmentName, attachmentType, attachmentSize

      // Upload de anexo se fornecido
      if (params.attachmentFile) {
        const fileExt = params.attachmentFile.name.split('.').pop()
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, params.attachmentFile)

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          throw new Error('Erro ao fazer upload do arquivo')
        }

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(fileName)

        attachmentUrl = urlData.publicUrl
        attachmentName = params.attachmentFile.name
        attachmentType = params.attachmentFile.type
        attachmentSize = params.attachmentFile.size
      }

      const messageData = {
        conversation_id: params.conversationId,
        sender_id: profile.id,
        content: params.content || '',
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        attachment_type: attachmentType || null,
        attachment_size: attachmentSize || null,
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      console.log('Message sent successfully')
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Hook para editar mensagem
export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { messageId: string; content: string }) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: params.content,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.messageId)
        .select()
        .single()

      if (error) {
        console.error('Error editing message:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] })
    },
  })
}

// Hook para deletar mensagem
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting message:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversation_id] })
    },
  })
}

// Hook para deletar conversa
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      console.log('Deleting conversation:', conversationId)

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) {
        console.error('Error deleting conversation:', error)
        throw error
      }

      console.log('Conversation deleted successfully')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

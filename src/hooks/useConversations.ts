
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'

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
  room_id: string
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
  room_id: string
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

// Hook para buscar salas de chat do usuário
export function useConversations() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)

  const query = useQuery({
    queryKey: ['chat-rooms', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching chat rooms for user:', profile.id)

      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          created_by,
          created_at,
          updated_at,
          type,
          unit_id,
          image_url,
          participants:chat_participants(
            id,
            user_id,
            joined_at,
            profiles(id, name, avatar_url, role)
          )
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching chat rooms:', error)
        throw error
      }

      console.log('Chat rooms fetched:', data?.length || 0)
      return data?.map(room => ({
        ...room,
        last_message_at: room.updated_at
      })) || []
    },
    enabled: !!profile?.id,
  })

  // Real-time updates with proper cleanup
  useEffect(() => {
    if (!profile?.id) return

    // Cleanup previous channel if it exists
    if (channelRef.current) {
      console.log('Removing existing channel')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    console.log('Creating new channel for chat rooms')
    const channel = supabase
      .channel('chat-rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        () => {
          console.log('Chat rooms changed, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
        },
        () => {
          console.log('Participants changed, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )

    channelRef.current = channel
    
    // Subscribe only once
    channel.subscribe((status) => {
      console.log('Channel subscription status:', status)
    })

    return () => {
      console.log('Cleaning up channel on unmount')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [profile?.id, queryClient])

  return query
}

// Hook para buscar mensagens de uma sala
export function useMessages(roomId?: string) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const channelRef = useRef<any>(null)

  const query = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return []

      console.log('Fetching messages for room:', roomId)

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          room_id,
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
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      console.log('Messages fetched:', data?.length || 0)
      return data?.map(msg => ({
        ...msg,
        conversation_id: msg.room_id
      })) || []
    },
    enabled: !!roomId && !!profile?.id,
  })

  // Real-time updates para mensagens with proper cleanup
  useEffect(() => {
    if (!roomId || !profile?.id) return

    // Cleanup previous channel if it exists
    if (channelRef.current) {
      console.log('Removing existing messages channel')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    console.log('Creating new channel for messages:', roomId)
    const channel = supabase
      .channel(`messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log('New message received, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          console.log('Message updated, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
        }
      )

    channelRef.current = channel
    
    // Subscribe only once
    channel.subscribe((status) => {
      console.log('Messages channel subscription status:', status)
    })

    return () => {
      console.log('Cleaning up messages channel on unmount')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [roomId, profile?.id, queryClient])

  return query
}

// Hook para buscar usuários disponíveis para chat
export function useUnitUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-chat-users', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching available chat users')

      const { data, error } = await supabase.rpc('get_chat_available_users')

      if (error) {
        console.error('Error fetching available users:', error)
        throw error
      }

      console.log('Available users fetched:', data?.length || 0)
      return data || []
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

      console.log('Creating private chat room:', params)

      // Verificar se já existe uma sala privada entre os dois usuários
      const { data: existingRoom } = await supabase.rpc('find_existing_private_chat', {
        user1_id: profile.id,
        user2_id: params.participantId
      })

      if (existingRoom) {
        console.log('Found existing private chat:', existingRoom)
        return existingRoom
      }

      // Criar nova sala privada
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{
          name: params.name,
          type: 'private',
          created_by: profile.id,
        }])
        .select('id')
        .single()

      if (roomError) {
        console.error('Error creating chat room:', roomError)
        throw roomError
      }

      // Adicionar participantes
      const participantData = [
        { room_id: room.id, user_id: profile.id },
        { room_id: room.id, user_id: params.participantId }
      ]

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantData)

      if (participantError) {
        console.error('Error adding participants:', participantError)
        throw participantError
      }

      console.log('Private chat created successfully:', room.id)
      return room.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
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

      console.log('Sending message to room:', params.conversationId)

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
        room_id: params.conversationId,
        sender_id: profile.id,
        content: params.content || '',
        attachment_url: attachmentUrl || null,
        attachment_name: attachmentName || null,
        attachment_type: attachmentType || null,
        attachment_size: attachmentSize || null,
      }

      const { data, error } = await supabase
        .from('chat_messages')
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

// Hook para editar mensagem
export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { messageId: string; content: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
    },
  })
}

// Hook para deletar mensagem
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { data, error } = await supabase
        .from('chat_messages')
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
    },
  })
}

// Hook para deletar conversa
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      console.log('Deleting chat room:', conversationId)

      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', conversationId)

      if (error) {
        console.error('Error deleting chat room:', error)
        throw error
      }

      console.log('Chat room deleted successfully')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

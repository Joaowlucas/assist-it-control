import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export interface ChatRoom {
  id: string
  name: string
  type: 'private' | 'unit' | 'group'
  unit_id?: string
  selected_units?: string[]
  image_url?: string
  is_active: boolean
  created_at: string
  created_by: string
  participants?: ChatParticipant[]
  profiles?: {
    id: string
    name: string
    avatar_url?: string
  }
  units?: {
    name: string
  }
  last_message?: {
    id: string
    content: string
    created_at: string
    sender_id: string
    profiles: {
      name: string
    }
  }
}

export interface ChatParticipant {
  id: string
  user_id: string
  room_id: string
  joined_at: string
  last_read_at?: string
  profiles: {
    id: string
    name: string
    avatar_url?: string
    role: 'admin' | 'technician' | 'user'
  }
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  edited_at?: string
  is_deleted?: boolean
  attachment_url?: string
  attachment_name?: string
  attachment_type?: string
  attachment_size?: number
  profiles: {
    id: string
    name: string
    avatar_url?: string
    role: 'admin' | 'technician' | 'user'
  }
}

export function useChatRooms() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['chat-rooms', profile?.id, profile?.role, profile?.unit_id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching chat rooms for user role:', profile.role)

      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          name,
          type,
          unit_id,
          selected_units,
          image_url,
          is_active,
          created_at,
          created_by,
          profiles!chat_rooms_created_by_fkey(id, name, avatar_url),
          units(name),
          participants:chat_participants(
            id,
            user_id,
            room_id,
            joined_at,
            last_read_at,
            profiles(id, name, avatar_url, role)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching chat rooms:', error)
        throw error
      }

      console.log('Chat rooms fetched successfully:', data?.length || 0, 'rooms')
      return (data as ChatRoom[]) || []
    },
    enabled: !!profile?.id,
  })

  // Real-time updates for chat rooms
  useEffect(() => {
    if (!profile?.id) return

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
          console.log('Chat participants changed, invalidating queries')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel) 
    }
  }, [profile?.id, queryClient])

  return query
}

export function useChatMessages(roomId?: string) {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

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

      console.log('Messages fetched:', data?.length || 0, 'messages')
      return (data as ChatMessage[]) || []
    },
    enabled: !!roomId && !!profile?.id,
  })

  // Real-time updates for messages
  useEffect(() => {
    if (!roomId || !profile?.id) return

    const channel = supabase
      .channel(`chat-messages-${roomId}`)
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, profile?.id, queryClient])

  return query
}

export function useChatParticipants(roomId?: string) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['chat-participants', roomId],
    queryFn: async () => {
      if (!roomId) return []

      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          id,
          user_id,
          room_id,
          joined_at,
          last_read_at,
          profiles(id, name, avatar_url, role)
        `)
        .eq('room_id', roomId)

      if (error) {
        console.error('Error fetching chat participants:', error)
        throw error
      }

      return (data as ChatParticipant[]) || []
    },
    enabled: !!roomId && !!profile?.id,
  })
}

export function useCreateChatRoom() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      name: string
      type?: 'private' | 'unit' | 'group'
      unitId?: string
      selectedUnits?: string[]
      participantIds?: string[]
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      console.log('Creating chat room with params:', params)

      // Para chats privados, verificar se já existe uma conversa entre os usuários
      if (params.type === 'private' && params.participantIds?.length === 1) {
        const { data: existingRoom, error: findError } = await supabase
          .rpc('find_private_chat_room', {
            user1_id: profile.id,
            user2_id: params.participantIds[0]
          })

        if (findError) {
          console.error('Error checking existing private chat:', findError)
        } else if (existingRoom) {
          console.log('Found existing private chat:', existingRoom)
          return existingRoom
        }
      }

      const roomData = {
        name: params.name,
        type: params.type || 'private',
        unit_id: params.unitId || null,
        selected_units: params.selectedUnits || [],
        created_by: profile.id,
      }

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([roomData])
        .select('id')
        .single()

      if (roomError) {
        console.error('Error creating chat room:', roomError)
        throw roomError
      }

      // Para chats privados, adicionar participantes específicos
      if (params.participantIds && params.participantIds.length > 0) {
        const participantData = params.participantIds.map(userId => ({
          room_id: room.id,
          user_id: userId,
        }))

        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert(participantData)

        if (participantError) {
          console.error('Error adding participants:', participantError)
        }
      }

      console.log('Chat room created successfully:', room.id)
      return room.id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

export function useUpdateChatRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      roomId: string
      name?: string
      imageUrl?: string
    }) => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .update({
          name: params.name,
          image_url: params.imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.roomId)
        .select()
        .single()

      if (error) {
        console.error('Error updating chat room:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      roomId: string
      content: string
      attachmentFile?: File
      attachmentUrl?: string
      attachmentName?: string
      attachmentType?: string
      attachmentSize?: number
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      console.log('Sending message to room:', params.roomId)

      let attachmentUrl = params.attachmentUrl
      let attachmentName = params.attachmentName
      let attachmentType = params.attachmentType
      let attachmentSize = params.attachmentSize

      // Upload file if provided
      if (params.attachmentFile) {
        const fileExt = params.attachmentFile.name.split('.').pop()
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, params.attachmentFile)

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          throw new Error('Erro ao fazer upload do arquivo')
        }

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)

        attachmentUrl = urlData.publicUrl
        attachmentName = params.attachmentFile.name
        attachmentType = params.attachmentFile.type
        attachmentSize = params.attachmentFile.size
      }

      const messageData = {
        room_id: params.roomId,
        sender_id: profile.id,
        content: params.content,
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
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.roomId] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
  })
}

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

export function useCanDeleteChatRoom(roomId: string) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['can-delete-chat-room', roomId, profile?.id],
    queryFn: async () => {
      if (!roomId || !profile?.id) return false

      // Admin can delete any room
      if (profile.role === 'admin') return true

      // Check if user is the creator of the room
      const { data: room, error } = await supabase
        .from('chat_rooms')
        .select('created_by')
        .eq('id', roomId)
        .single()

      if (error) {
        console.error('Error checking room permissions:', error)
        return false
      }

      return room.created_by === profile.id
    },
    enabled: !!roomId && !!profile?.id,
  })
}

export function useDeleteChatRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roomId: string) => {
      console.log('Deleting chat room:', roomId)

      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId)

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

// Re-export useAvailableChatUsers for compatibility
export { useAvailableChatUsers } from './useAvailableChatUsers'


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
  participant_count?: number
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

export interface AvailableChatUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  unit_id: string | null
  avatar_url: string | null
  unit_name?: string
}

// Hook otimizado para salas de chat com cache inteligente
export function useChatRoomsOptimized() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['chat-rooms-optimized', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('🚀 Fetching optimized chat rooms')

      // Query otimizada com join eficiente e índices
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
          chat_messages!inner(
            id,
            content,
            created_at,
            sender_id,
            profiles!inner(name)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1, { foreignTable: 'chat_messages' })
        .order('created_at', { ascending: false, foreignTable: 'chat_messages' })

      if (error) {
        console.error('❌ Error fetching chat rooms:', error)
        throw error
      }

      // Processar dados para formato otimizado
      const rooms = data?.map(room => ({
        ...room,
        last_message: room.chat_messages?.[0] || null,
        participant_count: 0 // Será populado em query separada se necessário
      })) || []

      console.log('✅ Chat rooms loaded:', rooms.length)
      return rooms as ChatRoom[]
    },
    enabled: !!profile?.id,
    staleTime: 30000, // Cache por 30 segundos
    refetchInterval: 60000, // Refetch a cada minuto
  })

  // Real-time otimizado
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('chat-rooms-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        () => {
          console.log('🔄 Chat rooms updated - invalidating cache')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms-optimized'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          console.log('📨 New message - updating rooms')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms-optimized'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  return query
}

// Hook para mensagens com paginação e cache otimizado
export function useChatMessagesOptimized(roomId?: string) {
  return useQuery({
    queryKey: ['chat-messages-optimized', roomId],
    queryFn: async () => {
      if (!roomId) return []

      console.log('📝 Fetching messages for room:', roomId)

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
          profiles!inner(id, name, avatar_url, role)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100) // Limite para performance

      if (error) {
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      console.log('✅ Messages loaded:', data?.length || 0)
      return (data as ChatMessage[]) || []
    },
    enabled: !!roomId,
    staleTime: 10000, // Cache por 10 segundos
  })
}

// Hook para usuários disponíveis com cache
export function useAvailableChatUsersOptimized() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-chat-users-optimized', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('👥 Fetching available users with optimized function')

      const { data, error } = await supabase.rpc('get_chat_available_users')

      if (error) {
        console.error('❌ Error fetching available users:', error)
        throw error
      }

      console.log('✅ Available users loaded:', data?.length || 0)
      return (data as AvailableChatUser[]) || []
    },
    enabled: !!profile?.id,
    staleTime: 60000, // Cache por 1 minuto
  })
}

// Função para verificar conversa existente (CRÍTICA)
export async function findExistingPrivateChat(userId1: string, userId2: string): Promise<string | null> {
  console.log('🔍 Checking for existing private chat between:', userId1, userId2)
  
  try {
    const { data, error } = await supabase.rpc('find_existing_private_chat', {
      user1_id: userId1,
      user2_id: userId2
    })

    if (error) {
      console.error('❌ Error checking existing chat:', error)
      return null
    }

    if (data) {
      console.log('✅ Found existing private chat:', data)
      return data
    }

    console.log('ℹ️ No existing private chat found')
    return null
  } catch (error) {
    console.error('❌ Exception checking existing chat:', error)
    return null
  }
}

// Hook otimizado para criar conversas (SEM DUPLICATAS)
export function useCreateChatRoomOptimized() {
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
      if (!profile?.id) throw new Error('❌ User not authenticated')

      console.log('🚀 Creating chat room with params:', params)

      // CRÍTICO: Para chats privados, verificar conversa existente PRIMEIRO
      if (params.type === 'private' && params.participantIds?.length === 1) {
        const existingRoomId = await findExistingPrivateChat(profile.id, params.participantIds[0])
        
        if (existingRoomId) {
          console.log('✅ Redirecting to existing private chat:', existingRoomId)
          // Invalidar cache para garantir dados atualizados
          queryClient.invalidateQueries({ queryKey: ['chat-rooms-optimized'] })
          return existingRoomId
        }
      }

      // Criar nova sala
      const roomData = {
        name: params.name,
        type: params.type || 'private',
        unit_id: params.unitId || null,
        selected_units: params.selectedUnits || [],
        created_by: profile.id,
      }

      console.log('📝 Creating new room with data:', roomData)

      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([roomData])
        .select('id')
        .single()

      if (roomError) {
        console.error('❌ Error creating chat room:', roomError)
        throw roomError
      }

      // Para chats privados, adicionar participante específico
      if (params.participantIds && params.participantIds.length > 0) {
        const participantData = params.participantIds.map(userId => ({
          room_id: room.id,
          user_id: userId,
        }))

        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert(participantData)

        if (participantError) {
          console.error('⚠️ Error adding participants:', participantError)
          // Não falhar a criação por erro de participante
        }
      }

      console.log('✅ Chat room created successfully:', room.id)
      return room.id
    },
    onSuccess: () => {
      // Invalidar múltiplos caches relacionados
      queryClient.invalidateQueries({ queryKey: ['chat-rooms-optimized'] })
      queryClient.invalidateQueries({ queryKey: ['available-chat-users-optimized'] })
    },
    onError: (error) => {
      console.error('❌ Failed to create chat room:', error)
    }
  })
}

// Hook otimizado para enviar mensagens
export function useSendMessageOptimized() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (params: {
      roomId: string
      content: string
      attachmentFile?: File
    }) => {
      if (!profile?.id) throw new Error('❌ User not authenticated')

      console.log('📨 Sending message to room:', params.roomId)

      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null
      let attachmentSize = null

      // Upload de anexo se fornecido
      if (params.attachmentFile) {
        const fileExt = params.attachmentFile.name.split('.').pop()
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(fileName, params.attachmentFile)

        if (uploadError) {
          console.error('❌ Error uploading file:', uploadError)
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
        room_id: params.roomId,
        sender_id: profile.id,
        content: params.content,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        attachment_size: attachmentSize,
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single()

      if (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }

      console.log('✅ Message sent successfully')
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['chat-messages-optimized', variables.roomId] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms-optimized'] })
    },
    onError: (error) => {
      console.error('❌ Failed to send message:', error)
    }
  })
}

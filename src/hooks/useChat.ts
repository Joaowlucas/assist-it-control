
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export interface ChatRoom {
  id: string
  name: string
  unit_id: string | null
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  units?: {
    name: string
  }
  participants?: Array<{
    user_id: string
    profiles: {
      name: string
      avatar_url: string | null
    }
  }>
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  edited_at: string | null
  is_deleted: boolean
  attachment_name: string | null
  attachment_url: string | null
  attachment_type: string | null
  attachment_size: number | null
  profiles?: {
    name: string
    avatar_url: string | null
  }
}

export interface ChatParticipant {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  last_read_at: string | null
  profiles: {
    name: string
    avatar_url: string | null
  }
}

export function useChatRooms() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['chat-rooms', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching chat rooms for user:', profile.id)

      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          units(name),
          chat_participants!inner(
            user_id,
            profiles(name, avatar_url)
          ),
          profiles!chat_rooms_created_by_fkey(name, avatar_url)
        `)
        .eq('chat_participants.user_id', profile.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching chat rooms:', error)
        throw error
      }

      console.log('Chat rooms fetched:', data)
      return data as ChatRoom[]
    },
    enabled: !!profile?.id,
  })
}

export function useChatMessages(roomId: string) {
  return useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      if (!roomId) return []

      console.log('Fetching messages for room:', roomId)

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles(name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      console.log('Messages fetched:', data)
      return data as ChatMessage[]
    },
    enabled: !!roomId,
  })
}

export function useChatParticipants(roomId: string) {
  return useQuery({
    queryKey: ['chat-participants', roomId],
    queryFn: async () => {
      if (!roomId) return []

      console.log('Fetching participants for room:', roomId)

      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          profiles(name, avatar_url)
        `)
        .eq('room_id', roomId)

      if (error) {
        console.error('Error fetching participants:', error)
        throw error
      }

      console.log('Participants fetched:', data)
      return data as ChatParticipant[]
    },
    enabled: !!roomId,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ roomId, content, attachmentFile }: {
      roomId: string
      content: string
      attachmentFile?: File
    }) => {
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }

      console.log('Sending message:', { roomId, content, hasAttachment: !!attachmentFile })

      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null
      let attachmentSize = null

      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `chat-attachments/${roomId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachmentFile)

        if (uploadError) {
          console.error('Error uploading attachment:', uploadError)
          throw uploadError
        }

        const { data: urlData } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)

        attachmentUrl = urlData.publicUrl
        attachmentName = attachmentFile.name
        attachmentType = attachmentFile.type
        attachmentSize = attachmentFile.size
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: profile.id,
          content,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_type: attachmentType,
          attachment_size: attachmentSize,
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      console.log('Message sent:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
    onError: (error) => {
      console.error('Error in sendMessage mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao enviar mensagem: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useEditMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ messageId, content }: {
      messageId: string
      content: string
    }) => {
      console.log('Editing message:', { messageId, content })

      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        console.error('Error editing message:', error)
        throw error
      }

      console.log('Message edited:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
    },
    onError: (error) => {
      console.error('Error in editMessage mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao editar mensagem: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (messageId: string) => {
      console.log('Deleting message:', messageId)

      const { data, error } = await supabase
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting message:', error)
        throw error
      }

      console.log('Message deleted:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
    },
    onError: (error) => {
      console.error('Error in deleteMessage mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao excluir mensagem: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteChatRoom() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (roomId: string) => {
      console.log('Deleting chat room:', roomId)

      const { data, error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId)
        .select()
        .single()

      if (error) {
        console.error('Error deleting chat room:', error)
        throw error
      }

      console.log('Chat room deleted:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Sala removida',
        description: 'A sala de chat foi removida com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in deleteChatRoom mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover sala: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateChatRoom() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ roomId, name, unitId, participants }: {
      roomId: string
      name: string
      unitId?: string | null
      participants: string[]
    }) => {
      console.log('Updating chat room:', { roomId, name, unitId, participants })

      // Atualizar dados da sala
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .update({
          name,
          unit_id: unitId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', roomId)

      if (roomError) {
        console.error('Error updating chat room:', roomError)
        throw roomError
      }

      // Remover participantes existentes
      const { error: deleteError } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId)

      if (deleteError) {
        console.error('Error removing old participants:', deleteError)
        throw deleteError
      }

      // Adicionar novos participantes
      const participantsData = participants.map(userId => ({
        room_id: roomId,
        user_id: userId,
      }))

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsData)

      if (participantsError) {
        console.error('Error adding new participants:', participantsError)
        throw participantsError
      }

      console.log('Chat room updated successfully')
      return roomId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      queryClient.invalidateQueries({ queryKey: ['chat-participants'] })
      toast({
        title: 'Sala atualizada',
        description: 'A sala de chat foi atualizada com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in updateChatRoom mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar sala: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useCreateChatRoom() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ name, unitId, participantIds }: {
      name: string
      unitId?: string | null
      participantIds: string[]
    }) => {
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }

      console.log('Creating chat room:', { name, unitId, participantIds })

      // Para conversas privadas (2 participantes), verificar se já existe uma conversa entre os mesmos usuários
      if (participantIds.length === 2) {
        const { data: existingRooms, error: searchError } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            name,
            chat_participants!inner(user_id)
          `)
          .eq('is_active', true)

        if (searchError) {
          console.error('Error searching existing rooms:', searchError)
        } else if (existingRooms) {
          // Verificar se há uma sala com exatamente os mesmos participantes
          const existingRoom = existingRooms.find(room => {
            const roomParticipants = room.chat_participants?.map(p => p.user_id).sort()
            const newParticipants = participantIds.sort()
            return roomParticipants?.length === 2 && 
                   roomParticipants?.length === newParticipants.length &&
                   roomParticipants?.every((id, index) => id === newParticipants[index])
          })

          if (existingRoom) {
            console.log('Found existing private conversation:', existingRoom.id)
            return existingRoom.id
          }
        }
      }

      // Criar nova sala
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          unit_id: unitId,
          created_by: profile.id,
        })
        .select()
        .single()

      if (roomError) {
        console.error('Error creating chat room:', roomError)
        throw roomError
      }

      // Adicionar participantes
      const participantsData = participantIds.map(userId => ({
        room_id: room.id,
        user_id: userId,
      }))

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsData)

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
        throw participantsError
      }

      console.log('Chat room created:', room.id)
      return room.id
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Conversa criada',
        description: 'Nova conversa iniciada com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in createChatRoom mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar conversa: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

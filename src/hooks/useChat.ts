
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

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
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['chat-rooms', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching chat rooms for user:', profile.id, 'with role:', profile.role)

      // Query base para buscar todas as salas acessíveis ao usuário
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          units(name),
          chat_participants(
            user_id,
            profiles(name, avatar_url)
          ),
          profiles!chat_rooms_created_by_fkey(name, avatar_url)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching chat rooms:', error)
        throw error
      }

      console.log('Chat rooms fetched:', data?.length || 0)
      return (data as ChatRoom[]) || []
    },
    enabled: !!profile?.id,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 segundos
  })

  // Configurar subscription para tempo real
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('chat-rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        },
        () => {
          console.log('Chat rooms changed, invalidating query')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants'
        },
        () => {
          console.log('Chat participants changed, invalidating query')
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

export function useChatMessages(roomId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
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

      console.log('Messages fetched for room:', roomId, 'count:', data?.length || 0)
      return (data as ChatMessage[]) || []
    },
    enabled: !!roomId,
    refetchOnWindowFocus: false,
  })

  // Subscription para mensagens em tempo real
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`chat-messages-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          console.log('Messages changed for room:', roomId)
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, queryClient])

  return query
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

      console.log('Participants fetched for room:', roomId, 'count:', data?.length || 0)
      return (data as ChatParticipant[]) || []
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
        const filePath = `${roomId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, attachmentFile)

        if (uploadError) {
          console.error('Error uploading attachment:', uploadError)
          throw new Error('Erro ao fazer upload do anexo: ' + uploadError.message)
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
        throw new Error('Erro ao enviar mensagem: ' + error.message)
      }

      console.log('Message sent successfully:', data.id)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in sendMessage mutation:', error)
      toast({
        title: 'Erro',
        description: error.message,
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
        throw new Error('Erro ao editar mensagem: ' + error.message)
      }

      console.log('Message edited successfully')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
      toast({
        title: 'Mensagem editada',
        description: 'Sua mensagem foi editada com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in editMessage mutation:', error)
      toast({
        title: 'Erro',
        description: error.message,
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
        throw new Error('Erro ao excluir mensagem: ' + error.message)
      }

      console.log('Message deleted successfully')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
      toast({
        title: 'Mensagem excluída',
        description: 'A mensagem foi excluída com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in deleteMessage mutation:', error)
      toast({
        title: 'Erro',
        description: error.message,
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
        throw new Error('Erro ao remover sala: ' + error.message)
      }

      console.log('Chat room deleted successfully')
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
        description: error.message,
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
        throw new Error('Erro ao atualizar sala: ' + roomError.message)
      }

      // Se não é uma sala de unidade, gerenciar participantes manualmente
      if (!unitId) {
        // Remover participantes existentes (exceto o criador)
        const { error: deleteError } = await supabase
          .from('chat_participants')
          .delete()
          .eq('room_id', roomId)
          .neq('user_id', (await supabase.from('chat_rooms').select('created_by').eq('id', roomId).single()).data?.created_by)

        if (deleteError) {
          console.error('Error removing old participants:', deleteError)
          throw new Error('Erro ao remover participantes: ' + deleteError.message)
        }

        // Adicionar novos participantes
        if (participants.length > 0) {
          const participantsData = participants.map(userId => ({
            room_id: roomId,
            user_id: userId,
          }))

          const { error: participantsError } = await supabase
            .from('chat_participants')
            .insert(participantsData)

          if (participantsError) {
            console.error('Error adding new participants:', participantsError)
            throw new Error('Erro ao adicionar participantes: ' + participantsError.message)
          }
        }
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
        description: error.message,
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

      // Para conversas privadas (apenas 2 participantes), verificar se já existe
      if (!unitId && participantIds.length === 1) {
        const allParticipants = [participantIds[0], profile.id].sort()
        
        // Buscar conversas privadas existentes
        const { data: existingRooms } = await supabase
          .from('chat_rooms')
          .select(`
            id,
            chat_participants(user_id)
          `)
          .eq('is_active', true)
          .is('unit_id', null)

        if (existingRooms) {
          for (const room of existingRooms) {
            const roomParticipants = room.chat_participants?.map(p => p.user_id).sort()
            if (roomParticipants?.length === 2 &&
                roomParticipants.every((id, index) => id === allParticipants[index])) {
              console.log('Found existing private conversation:', room.id)
              return room.id
            }
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
        throw new Error('Erro ao criar conversa: ' + roomError.message)
      }

      // Para salas não-unitárias, adicionar participantes manualmente
      if (!unitId && participantIds.length > 0) {
        const participantsData = participantIds.map(userId => ({
          room_id: room.id,
          user_id: userId,
        }))

        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(participantsData)

        if (participantsError) {
          console.error('Error adding participants:', participantsError)
          throw new Error('Erro ao adicionar participantes: ' + participantsError.message)
        }
      }

      console.log('Chat room created successfully:', room.id)
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
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useAvailableChatUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-chat-users', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching available users for chat')

      let query = supabase
        .from('profiles')
        .select('id, name, avatar_url, role, unit_id, units(name)')
        .eq('status', 'ativo')
        .neq('id', profile.id)

      // Filtrar usuários baseado no role do usuário atual
      if (profile.role === 'user') {
        // Usuários comuns: mesma unidade + técnicos + admins
        query = query.or(`unit_id.eq.${profile.unit_id},role.eq.technician,role.eq.admin`)
      } else if (profile.role === 'technician') {
        // Técnicos: suas unidades + outros técnicos + admins + usuários das unidades
        const { data: techUnits } = await supabase
          .from('technician_units')
          .select('unit_id')
          .eq('technician_id', profile.id)

        const unitIds = techUnits?.map(tu => tu.unit_id) || []
        if (profile.unit_id && !unitIds.includes(profile.unit_id)) {
          unitIds.push(profile.unit_id)
        }

        if (unitIds.length > 0) {
          const unitFilter = unitIds.map(id => `unit_id.eq.${id}`).join(',')
          query = query.or(`${unitFilter},role.eq.technician,role.eq.admin`)
        } else {
          query = query.or(`role.eq.technician,role.eq.admin`)
        }
      }
      // Admins podem conversar com qualquer pessoa (sem filtro adicional)

      const { data, error } = await query.order('name')

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

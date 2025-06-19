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
  image_url: string | null
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

      // Com as novas políticas RLS simplificadas, a query básica já filtra automaticamente
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          units(name),
          participants:chat_participants(
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
    staleTime: 30000,
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
        (payload) => {
          console.log('Chat rooms changed:', payload.eventType, payload.new || payload.old)
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
        (payload) => {
          console.log('Chat participants changed:', payload.eventType)
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile changed, invalidating chat rooms query')
          queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings'
        },
        () => {
          console.log('System settings changed, invalidating related queries')
          queryClient.invalidateQueries({ queryKey: ['system-settings'] })
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
        (payload) => {
          console.log('Messages changed for room:', roomId, payload.eventType)
          queryClient.invalidateQueries({ queryKey: ['chat-messages', roomId] })
          // Também atualizar a lista de salas quando há nova mensagem
          if (payload.eventType === 'INSERT') {
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          console.log('Profile changed, invalidating messages query')
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

      // Usar a nova função can_manage_room
      const { data: canDelete, error: checkError } = await supabase
        .rpc('can_manage_room', { 
          room_id: roomId
        })

      if (checkError) {
        console.error('Error checking delete permission:', checkError)
        throw new Error('Erro ao verificar permissões: ' + checkError.message)
      }

      if (!canDelete) {
        throw new Error('Você não tem permissão para excluir esta conversa')
      }

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
        title: 'Conversa removida',
        description: 'A conversa foi removida com sucesso',
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
        // Buscar participantes atuais
        const { data: currentParticipants, error: fetchError } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('room_id', roomId)

        if (fetchError) {
          console.error('Error fetching current participants:', fetchError)
          throw new Error('Erro ao buscar participantes atuais: ' + fetchError.message)
        }

        const currentUserIds = currentParticipants?.map(p => p.user_id) || []
        
        // Buscar o criador da sala para garantir que não seja removido
        const { data: roomData, error: roomFetchError } = await supabase
          .from('chat_rooms')
          .select('created_by')
          .eq('id', roomId)
          .single()

        if (roomFetchError) {
          console.error('Error fetching room creator:', roomFetchError)
          throw new Error('Erro ao buscar criador da sala: ' + roomFetchError.message)
        }

        const creatorId = roomData.created_by

        // Calcular participantes a adicionar (novos participantes que não existem)
        const participantsToAdd = participants.filter(userId => !currentUserIds.includes(userId))

        // Calcular participantes a remover (participantes atuais que não estão na nova lista, exceto o criador)
        const participantsToRemove = currentUserIds.filter(userId => 
          !participants.includes(userId) && userId !== creatorId
        )

        console.log('Participants to add:', participantsToAdd)
        console.log('Participants to remove:', participantsToRemove)

        // Remover participantes que não estão mais selecionados (exceto o criador)
        if (participantsToRemove.length > 0) {
          const { error: removeError } = await supabase
            .from('chat_participants')
            .delete()
            .eq('room_id', roomId)
            .in('user_id', participantsToRemove)

          if (removeError) {
            console.error('Error removing participants:', removeError)
            throw new Error('Erro ao remover participantes: ' + removeError.message)
          }
        }

        // Adicionar novos participantes
        if (participantsToAdd.length > 0) {
          const participantsData = participantsToAdd.map(userId => ({
            room_id: roomId,
            user_id: userId,
          }))

          const { error: addError } = await supabase
            .from('chat_participants')
            .insert(participantsData)

          if (addError) {
            console.error('Error adding new participants:', addError)
            throw new Error('Erro ao adicionar participantes: ' + addError.message)
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
    mutationFn: async ({ name, unitId, participantIds, imageUrl }: {
      name: string
      unitId?: string | null
      participantIds: string[]
      imageUrl?: string | null
    }) => {
      if (!profile?.id) {
        throw new Error('User not authenticated')
      }

      console.log('Creating chat room:', { name, unitId, participantIds, imageUrl })

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
          image_url: imageUrl,
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
      queryClient.refetchQueries({ queryKey: ['chat-rooms'] })
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

// Nova função para verificar se o usuário pode excluir uma sala usando a função atualizada
export function useCanDeleteChatRoom(roomId: string) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['can-delete-chat-room', roomId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !roomId) return false

      const { data, error } = await supabase
        .rpc('can_manage_room', { 
          room_id: roomId
        })

      if (error) {
        console.error('Error checking delete permission:', error)
        return false
      }

      return data
    },
    enabled: !!profile?.id && !!roomId,
  })
}

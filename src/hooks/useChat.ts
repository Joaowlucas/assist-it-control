
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
  units?: { name: string }
  profiles?: { name: string }
}

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: { name: string; avatar_url: string | null }
}

export interface ChatParticipant {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  last_read_at: string | null
  profiles?: { name: string; avatar_url: string | null }
}

export function useChatRooms() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['chat-rooms'],
    queryFn: async () => {
      console.log('Fetching chat rooms...')
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          units (name),
          profiles!chat_rooms_created_by_fkey (name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching chat rooms:', error)
        throw error
      }
      console.log('Chat rooms fetched:', data)
      return data as ChatRoom[]
    },
    enabled: !!profile,
  })
}

export function useChatMessages(roomId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      return data as ChatMessage[]
    },
    enabled: !!roomId,
  })

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New message received:', payload)
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
      const { data, error } = await supabase
        .from('chat_participants')
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq('room_id', roomId)

      if (error) throw error
      return data as ChatParticipant[]
    },
    enabled: !!roomId,
  })
}

export function useSendMessage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          content,
          sender_id: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.room_id] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar mensagem',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useCreateChatRoom() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, unitId, participants }: { 
      name: string; 
      unitId?: string; 
      participants: string[] 
    }) => {
      console.log('Creating chat room:', { name, unitId, participants })
      
      // Obter o usuário atual
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData.user) {
        console.error('Error getting current user:', userError)
        throw new Error('Usuário não autenticado')
      }

      const currentUserId = userData.user.id
      console.log('Current user ID:', currentUserId)

      // Verificar se há participantes selecionados
      if (!participants || participants.length === 0) {
        throw new Error('É necessário selecionar pelo menos um participante')
      }

      // Garantir que o criador esteja na lista de participantes
      const allParticipants = [...new Set([currentUserId, ...participants])]
      console.log('All participants (including creator):', allParticipants)

      try {
        // Criar a sala
        console.log('Creating room...')
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name,
            unit_id: unitId || null,
            created_by: currentUserId,
          })
          .select()
          .single()

        if (roomError) {
          console.error('Error creating room:', roomError)
          throw new Error(`Erro ao criar sala: ${roomError.message}`)
        }

        console.log('Room created successfully:', room)

        // Adicionar todos os participantes (incluindo o criador)
        console.log('Adding participants...')
        const participantsData = allParticipants.map(userId => ({
          room_id: room.id,
          user_id: userId,
        }))

        console.log('Participants data to insert:', participantsData)

        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(participantsData)

        if (participantsError) {
          console.error('Error adding participants:', participantsError)
          // Se falhar ao adicionar participantes, tentar excluir a sala criada
          await supabase.from('chat_rooms').delete().eq('id', room.id)
          throw new Error(`Erro ao adicionar participantes: ${participantsError.message}`)
        }

        console.log('Participants added successfully')
        return room
      } catch (error) {
        console.error('Error in chat room creation process:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Sala criada com sucesso!',
        description: 'A nova sala de chat foi criada e você foi adicionado automaticamente.',
      })
    },
    onError: (error: any) => {
      console.error('Chat room creation failed:', error)
      toast({
        title: 'Erro ao criar sala',
        description: error.message || 'Ocorreu um erro inesperado ao criar a sala',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteChatRoom() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('chat_rooms')
        .update({ is_active: false })
        .eq('id', roomId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Sala excluída',
        description: 'A sala de chat foi desativada.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir sala',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

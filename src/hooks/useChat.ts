
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
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          units (name),
          profiles!chat_rooms_created_by_fkey (name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
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
      // Criar a sala
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          unit_id: unitId || null,
          created_by: (await supabase.auth.getUser()).data.user?.id!,
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Adicionar participantes
      const participantsData = participants.map(userId => ({
        room_id: room.id,
        user_id: userId,
      }))

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantsData)

      if (participantsError) throw participantsError

      return room
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Sala criada com sucesso!',
        description: 'A nova sala de chat foi criada.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar sala',
        description: error.message,
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

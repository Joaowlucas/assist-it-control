
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'

export function useChatRooms() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['chat-rooms', profile?.id],
    queryFn: async () => {
      console.log('Fetching chat rooms')
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          unit:units(name),
          chat_participants(user_id),
          chat_messages(id, created_at)
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching chat rooms:', error)
        throw error
      }
      
      return data
    },
    enabled: !!profile,
  })
}

export function useChatMessages(roomId: string) {
  const [messages, setMessages] = useState<any[]>([])
  
  const { data: initialMessages } = useQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles(name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!roomId,
  })

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

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
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const { data: newMessage } = await supabase
            .from('chat_messages')
            .select(`
              *,
              sender:profiles(name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (newMessage) {
            setMessages(prev => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId])

  return { messages }
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ roomId, content }: { roomId: string; content: string }) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          content
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
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
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ name, unitId, userIds }: { 
      name: string; 
      unitId: string; 
      userIds: string[] 
    }) => {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          unit_id: unitId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add participants
      const participants = userIds.map(userId => ({
        room_id: room.id,
        user_id: userId
      }))

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants)

      if (participantsError) throw participantsError

      return room
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })
      toast({
        title: 'Sala criada!',
        description: 'A sala de chat foi criada com sucesso.',
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

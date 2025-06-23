
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  avatar_url?: string
  created_at: string
  updated_at: string
  lastMessage?: {
    content: string
    created_at: string
    sender_name: string
  }
  unreadCount: number
  participants?: Array<{
    id: string
    name: string
    avatar_url?: string
  }>
}

export function useConversations() {
  const { profile } = useAuth()

  const { data: conversations = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['conversations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          name,
          type,
          avatar_url,
          created_at,
          updated_at,
          conversation_participants!inner (
            user_id,
            profiles (
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('conversation_participants.user_id', profile.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations:', error)
        throw error
      }

      // Get last messages and unread counts for each conversation
      const conversationsWithDetails = await Promise.all(
        data.map(async (conv: any) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('chat_messages')
            .select(`
              content,
              created_at,
              profiles (name)
            `)
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('is_deleted', false)
            .not('message_reads.user_id', 'eq', profile.id)

          // Format participants (exclude current user for direct chats)
          const participants = conv.conversation_participants
            .map((p: any) => p.profiles)
            .filter((p: any) => p.id !== profile.id)

          return {
            id: conv.id,
            name: conv.name,
            type: conv.type,
            avatar_url: conv.avatar_url,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              created_at: lastMessage.created_at,
              sender_name: lastMessage.profiles?.name || 'Usuário'
            } : undefined,
            unreadCount: unreadCount || 0,
            participants
          } as Conversation
        })
      )

      return conversationsWithDetails
    },
    enabled: !!profile?.id
  })

  // Setup realtime subscription
  useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('conversations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          refetch()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, refetch])

  return {
    conversations,
    loading,
    refetch
  }
}

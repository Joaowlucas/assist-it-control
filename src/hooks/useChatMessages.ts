
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  updated_at: string
  edited_at?: string
  message_type: string
  reply_to_id?: string
  attachments?: Array<{
    id: string
    file_name: string
    file_url: string
    attachment_type: string
    thumbnail_url?: string
  }>
  sender: {
    id: string
    name: string
    avatar_url?: string
  }
  reply_to?: {
    id: string
    content: string
    sender_name: string
  }
  read_by?: Array<{
    user_id: string
    read_at: string
    user_name: string
  }>
}

export function useChatMessages(conversationId: string) {
  const { profile } = useAuth()
  const [page, setPage] = useState(0)
  const limit = 50

  const { data: messages = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['chat-messages', conversationId, page],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!chat_messages_sender_id_fkey (
            id,
            name,
            avatar_url
          ),
          message_attachments (
            id,
            file_name,
            file_url,
            attachment_type,
            thumbnail_url
          ),
          reply_to:chat_messages!chat_messages_reply_to_id_fkey (
            id,
            content,
            profiles!chat_messages_sender_id_fkey (name)
          ),
          message_reads (
            user_id,
            read_at,
            profiles (name)
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }

      return data.reverse().map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        sender_id: msg.sender_id,
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        edited_at: msg.edited_at,
        message_type: msg.message_type,
        reply_to_id: msg.reply_to_id,
        attachments: msg.message_attachments,
        sender: {
          id: msg.profiles.id,
          name: msg.profiles.name,
          avatar_url: msg.profiles.avatar_url
        },
        reply_to: msg.reply_to ? {
          id: msg.reply_to.id,
          content: msg.reply_to.content,
          sender_name: msg.reply_to.profiles?.name || 'Usuário'
        } : undefined,
        read_by: msg.message_reads.map((read: any) => ({
          user_id: read.user_id,
          read_at: read.read_at,
          user_name: read.profiles?.name || 'Usuário'
        }))
      }))
    },
    enabled: !!conversationId
  })

  // Mark messages as read
  useEffect(() => {
    if (!conversationId || !profile?.id || messages.length === 0) return

    const markAsRead = async () => {
      const unreadMessages = messages.filter(msg => 
        msg.sender_id !== profile.id && 
        !msg.read_by?.some(read => read.user_id === profile.id)
      )

      if (unreadMessages.length === 0) return

      const reads = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: profile.id
      }))

      await supabase
        .from('message_reads')
        .upsert(reads, { 
          onConflict: 'message_id,user_id',
          ignoreDuplicates: true 
        })
    }

    const timeoutId = setTimeout(markAsRead, 1000)
    return () => clearTimeout(timeoutId)
  }, [messages, conversationId, profile?.id])

  // Setup realtime subscription
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          refetch()
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, refetch])

  const loadMore = () => {
    setPage(prev => prev + 1)
  }

  const hasMore = messages.length === (page + 1) * limit

  return {
    messages,
    loading,
    loadMore,
    hasMore,
    refetch
  }
}

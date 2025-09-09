import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: string
  status: string
  reply_to_id?: string
  mentions: any[]
  created_at: string
  updated_at: string
  is_deleted: boolean
  profiles: {
    name: string
    avatar_url?: string
    role: string
  }
  user_id: string // Alias para sender_id para compatibilidade
}

interface Conversation {
  id: string
  name?: string
  type: 'direct' | 'group'
  unit_id?: string
  created_by: string
  created_at: string
  updated_at: string
  is_active: boolean
  description?: string
  avatar_url?: string
}

interface Participant {
  id: string
  conversation_id: string
  user_id: string
  role: string
  user: {
    name: string
    avatar_url?: string
    role: string
  }
}

export function useChatMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [typing, setTyping] = useState<string[]>([])
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const fetchMessages = async () => {
    if (!conversationId) return

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          status,
          reply_to_id,
          mentions,
          created_at,
          updated_at,
          is_deleted,
          profiles!sender_id (
            name,
            avatar_url,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Mapear para incluir user_id como alias de sender_id
      const mappedMessages = data.map(message => ({
        ...message,
        user_id: message.sender_id,
        content: message.content || '',
        mentions: Array.isArray(message.mentions) ? message.mentions : []
      }))

      setMessages(mappedMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as mensagens",
        variant: "destructive",
      })
    }
  }

  const fetchConversation = async () => {
    if (!conversationId) return

    try {
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (conversationError) throw conversationError
      setConversation(conversationData)

      // Buscar participantes
      const { data: participantsData, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          id,
          conversation_id,
          user_id,
          role,
          profiles!user_id (
            name,
            avatar_url,
            role
          )
        `)
        .eq('conversation_id', conversationId)
        .is('left_at', null)

      if (participantsError) throw participantsError

      const mappedParticipants = participantsData.map(p => ({
        ...p,
        user: p.profiles
      }))

      setParticipants(mappedParticipants)
    } catch (error) {
      console.error('Error fetching conversation:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar a conversa",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (conversationId) {
      setLoading(true)
      Promise.all([fetchMessages(), fetchConversation()]).finally(() => {
        setLoading(false)
      })
    }
  }, [conversationId])

  // Configurar realtime para mensagens
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Buscar dados completos da nova mensagem
          const { data: newMessage, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              status,
              reply_to_id,
              mentions,
              created_at,
              updated_at,
              is_deleted,
              profiles!sender_id (
                name,
                avatar_url,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && newMessage) {
            const mappedMessage = {
              ...newMessage,
              user_id: newMessage.sender_id,
              content: newMessage.content || '',
              mentions: Array.isArray(newMessage.mentions) ? newMessage.mentions : []
            }
            setMessages(prev => [...prev, mappedMessage])
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Buscar dados completos da mensagem atualizada
          const { data: updatedMessage, error } = await supabase
            .from('chat_messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              status,
              reply_to_id,
              mentions,
              created_at,
              updated_at,
              is_deleted,
              profiles!sender_id (
                name,
                avatar_url,
                role
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (!error && updatedMessage) {
            const mappedMessage = {
              ...updatedMessage,
              user_id: updatedMessage.sender_id,
              content: updatedMessage.content || '',
              mentions: Array.isArray(updatedMessage.mentions) ? updatedMessage.mentions : []
            }
            setMessages(prev => 
              prev.map(msg => 
                msg.id === mappedMessage.id ? mappedMessage : msg
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const sendMessage = async (content: string, messageType: string = 'text') => {
    if (!user || !conversationId) throw new Error('Usuário ou conversa não encontrados')

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          status: 'sent'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      })
      throw error
    }
  }

  return {
    messages,
    conversation,
    participants,
    loading,
    typing,
    sendMessage,
    refetch: () => Promise.all([fetchMessages(), fetchConversation()])
  }
}
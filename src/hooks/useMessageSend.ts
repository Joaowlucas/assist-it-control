
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'
import { toast } from '@/hooks/use-toast'

interface SendMessageParams {
  conversationId: string
  content: string
  attachments?: Array<{
    file_name: string
    file_url: string
    attachment_type: 'image' | 'video' | 'document' | 'audio'
    file_size: number
  }>
}

export function useMessageSend() {
  const [loading, setLoading] = useState(false)
  const { profile } = useAuth()

  const sendMessage = async ({ conversationId, content, attachments = [] }: SendMessageParams) => {
    if (!profile?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      // Insert message
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content,
          message_type: attachments.length > 0 ? 'mixed' : 'text',
          status: 'sent'
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Insert attachments if any
      if (attachments.length > 0 && messageData) {
        const attachmentInserts = attachments.map(attachment => ({
          message_id: messageData.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
          attachment_type: attachment.attachment_type,
          file_size: attachment.file_size
        }))

        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert(attachmentInserts)

        if (attachmentError) throw attachmentError
      }

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return messageData
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente.",
        variant: "destructive"
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { sendMessage, loading }
}

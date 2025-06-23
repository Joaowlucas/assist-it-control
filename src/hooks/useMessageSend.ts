
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
      console.error('User not authenticated')
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      })
      return
    }

    console.log('Sending message:', {
      conversationId,
      content,
      attachments,
      senderId: profile.id
    })

    try {
      setLoading(true)

      // Verificar se o usuário tem acesso à conversa
      const { data: hasAccess } = await supabase
        .rpc('can_access_conversation', {
          conversation_id: conversationId,
          user_id: profile.id
        })

      if (!hasAccess) {
        console.error('User does not have access to this conversation')
        throw new Error('Acesso negado à conversa')
      }

      // Inserir mensagem
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

      if (messageError) {
        console.error('Error inserting message:', messageError)
        throw messageError
      }

      console.log('Message inserted:', messageData)

      // Inserir anexos se houver
      if (attachments.length > 0 && messageData) {
        const attachmentInserts = attachments.map(attachment => ({
          message_id: messageData.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
          attachment_type: attachment.attachment_type,
          file_size: attachment.file_size
        }))

        console.log('Inserting attachments:', attachmentInserts)

        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert(attachmentInserts)

        if (attachmentError) {
          console.error('Error inserting attachments:', attachmentError)
          throw attachmentError
        }
      }

      // Atualizar timestamp da conversa
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError)
        // Não falhar por causa disso, apenas logar
      }

      console.log('Message sent successfully')
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

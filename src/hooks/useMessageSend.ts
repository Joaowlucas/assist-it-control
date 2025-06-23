
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface SendMessageParams {
  conversationId: string
  content: string
  attachments?: Array<{
    file_name: string
    file_url: string
    attachment_type: string
    file_size: number
  }>
  replyToId?: string
}

export function useMessageSend() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (params: SendMessageParams) => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { conversationId, content, attachments, replyToId } = params

      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content,
          message_type: attachments && attachments.length > 0 ? 'attachment' : 'text',
          reply_to_id: replyToId
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Insert attachments if any
      if (attachments && attachments.length > 0) {
        const attachmentRecords = attachments.map(att => ({
          message_id: message.id,
          file_name: att.file_name,
          file_url: att.file_url,
          attachment_type: att.attachment_type,
          file_size: att.file_size
        }))

        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert(attachmentRecords)

        if (attachmentError) throw attachmentError
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      return message
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })

  return {
    sendMessage: mutation.mutate,
    loading: mutation.isPending
  }
}


import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useUpdateTicketAttachments() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const addAttachments = useMutation({
    mutationFn: async ({ ticketId, images }: { ticketId: string; images: File[] }) => {
      console.log('Adding attachments to ticket:', ticketId, images.length)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      for (const image of images) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${user.id}/${ticketId}/${Math.random()}.${fileExt}`
        
        // Upload da imagem
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        // Criar registro do anexo
        const { error: attachmentError } = await supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            file_name: image.name,
            file_path: fileName,
            file_size: image.size,
            mime_type: image.type,
            uploaded_by: user.id
          })

        if (attachmentError) {
          console.error('Attachment error:', attachmentError)
          throw attachmentError
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      toast({
        title: 'Anexos adicionados!',
        description: 'Os anexos foram adicionados com sucesso.',
      })
    },
    onError: (error) => {
      console.error('Error adding attachments:', error)
      toast({
        title: 'Erro ao adicionar anexos',
        description: error.message || 'Erro ao adicionar os anexos.',
        variant: 'destructive',
      })
    },
  })

  const removeAttachment = useMutation({
    mutationFn: async ({ attachmentId, filePath }: { attachmentId: string; filePath: string }) => {
      console.log('Removing attachment:', attachmentId, filePath)
      
      // Remover arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([filePath])

      if (storageError) {
        console.error('Storage error:', storageError)
        // Não bloquear a remoção do registro se o arquivo já foi removido
      }

      // Remover registro do anexo
      const { error: dbError } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) {
        console.error('Database error:', dbError)
        throw dbError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      toast({
        title: 'Anexo removido!',
        description: 'O anexo foi removido com sucesso.',
      })
    },
    onError: (error) => {
      console.error('Error removing attachment:', error)
      toast({
        title: 'Erro ao remover anexo',
        description: error.message || 'Erro ao remover o anexo.',
        variant: 'destructive',
      })
    },
  })

  return {
    addAttachments,
    removeAttachment
  }
}

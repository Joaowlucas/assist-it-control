
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export function useAddTicketAttachment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ ticketId, files }: { ticketId: string, files: File[] }) => {
      if (!profile) {
        throw new Error('Usuário não autenticado')
      }

      console.log('Adding attachments to ticket:', ticketId, files.length)

      const uploadedAttachments = []

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          throw uploadError
        }

        // Criar registro do anexo
        const { data: attachment, error: attachmentError } = await supabase
          .from('ticket_attachments')
          .insert({
            ticket_id: ticketId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            uploaded_by: profile.id
          })
          .select()
          .single()

        if (attachmentError) {
          console.error('Error creating attachment record:', attachmentError)
          throw attachmentError
        }

        uploadedAttachments.push(attachment)
      }

      return uploadedAttachments
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({
        title: 'Sucesso',
        description: 'Anexos adicionados com sucesso',
      })
    },
    onError: (error: any) => {
      console.error('Error adding attachments:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar anexos: ' + (error.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

export function useRemoveTicketAttachment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ attachmentId, filePath }: { attachmentId: string, filePath: string }) => {
      console.log('Removing attachment:', attachmentId, filePath)

      // Remover arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([filePath])

      if (storageError) {
        console.error('Error removing file from storage:', storageError)
        // Continuar mesmo se houver erro no storage, pois o arquivo pode já ter sido removido
      }

      // Remover registro do banco
      const { error: dbError } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) {
        console.error('Error removing attachment record:', dbError)
        throw dbError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] })
      toast({
        title: 'Sucesso',
        description: 'Anexo removido com sucesso',
      })
    },
    onError: (error: any) => {
      console.error('Error removing attachment:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover anexo: ' + (error.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

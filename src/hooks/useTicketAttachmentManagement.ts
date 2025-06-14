
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

        console.log('Uploading file:', file.name, 'to path:', filePath)

        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          throw uploadError
        }

        console.log('File uploaded successfully, creating database record')

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

        console.log('Attachment record created:', attachment)
        uploadedAttachments.push(attachment)
      }

      return uploadedAttachments
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] })
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

      // Remover registro do banco primeiro
      const { error: dbError } = await supabase
        .from('ticket_attachments')
        .delete()
        .eq('id', attachmentId)

      if (dbError) {
        console.error('Error removing attachment record:', dbError)
        throw dbError
      }

      // Remover arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('ticket-attachments')
        .remove([filePath])

      if (storageError) {
        console.error('Error removing file from storage:', storageError)
        // Não falhar se o arquivo não existir no storage
      }

      console.log('Attachment removed successfully')
    },
    onSuccess: () => {
      // Invalidar todas as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['ticket-attachments'] })
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      
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


import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      console.log('Fetching ticket attachments for:', ticketId)
      
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select(`
          *,
          uploader:profiles(name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching ticket attachments:', error)
        throw error
      }
      
      // Gerar URLs públicas para as imagens
      const attachmentsWithUrls = data?.map(attachment => {
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(attachment.file_path)
        
        return {
          ...attachment,
          public_url: urlData.publicUrl
        }
      }) || []
      
      console.log('Ticket attachments fetched:', attachmentsWithUrls)
      return attachmentsWithUrls
    },
    enabled: !!ticketId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}

export function getAttachmentPublicUrl(filePath: string) {
  const { data } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

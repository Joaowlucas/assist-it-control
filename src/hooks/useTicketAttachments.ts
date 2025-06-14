
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      console.log('Fetching ticket attachments for:', ticketId)
      
      if (!ticketId) {
        console.log('No ticketId provided')
        return []
      }
      
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
      
      console.log('Raw attachments data:', data)
      
      // Gerar URLs públicas para as imagens
      const attachmentsWithUrls = data?.map(attachment => {
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(attachment.file_path)
        
        console.log('Generated URL for', attachment.file_name, ':', urlData.publicUrl)
        
        return {
          ...attachment,
          public_url: urlData.publicUrl
        }
      }) || []
      
      console.log('Ticket attachments with URLs:', attachmentsWithUrls)
      return attachmentsWithUrls
    },
    enabled: !!ticketId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

export function getAttachmentPublicUrl(filePath: string) {
  const { data } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

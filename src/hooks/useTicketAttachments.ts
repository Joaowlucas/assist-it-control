
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-attachments', ticketId],
    queryFn: async () => {
      console.log('🔍 Fetching ticket attachments for:', ticketId)
      
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select(`
          *,
          uploader:profiles(name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error fetching ticket attachments:', error)
        throw error
      }
      
      console.log('📎 Raw attachments data:', data)
      
      // Gerar URLs públicas para os anexos
      const attachmentsWithUrls = data?.map(attachment => {
        console.log('🔗 Generating URL for file_path:', attachment.file_path)
        
        const { data: urlData } = supabase.storage
          .from('ticket-attachments')
          .getPublicUrl(attachment.file_path)
        
        console.log('🌐 Generated public URL:', urlData.publicUrl)
        
        return {
          ...attachment,
          public_url: urlData.publicUrl
        }
      }) || []
      
      console.log('✅ Attachments with URLs:', attachmentsWithUrls)
      return attachmentsWithUrls
    },
    enabled: !!ticketId,
  })
}

export function getAttachmentPublicUrl(filePath: string) {
  console.log('🔗 Getting public URL for:', filePath)
  
  const { data } = supabase.storage
    .from('ticket-attachments')
    .getPublicUrl(filePath)
  
  console.log('🌐 Public URL result:', data.publicUrl)
  return data.publicUrl
}


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type TicketComment = Tables<'ticket_comments'>
type TicketCommentInsert = TablesInsert<'ticket_comments'>

export function useTicketComments(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      if (!ticketId) return []
      
      console.log('Fetching comments for ticket:', ticketId)
      
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:profiles(name, email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching ticket comments:', error)
        throw error
      }
      
      console.log('Ticket comments fetched:', data)
      return data || []
    },
    enabled: !!ticketId,
  })
}

export function useCreateTicketComment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (comment: TicketCommentInsert) => {
      console.log('Creating ticket comment:', comment)
      
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert(comment)
        .select(`
          *,
          user:profiles(name, email)
        `)
        .single()
      
      if (error) {
        console.error('Error creating ticket comment:', error)
        throw error
      }
      
      console.log('Ticket comment created:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', data.ticket_id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.ticket_id] })
      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in createTicketComment mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar comentário: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

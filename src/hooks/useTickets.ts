import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type Ticket = Tables<'tickets'>
type TicketInsert = TablesInsert<'tickets'>
type TicketUpdate = TablesUpdate<'tickets'>

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      console.log('Fetching tickets...')
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email),
          unit:units(name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching tickets:', error)
        throw error
      }
      
      // Buscar contagem de anexos para cada ticket
      const ticketsWithAttachments = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('ticket_attachments')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
          
          return {
            ...ticket,
            attachments_count: count || 0
          }
        })
      )
      
      console.log('Tickets fetched:', ticketsWithAttachments)
      return ticketsWithAttachments
    },
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      console.log('Fetching ticket:', id)
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email),
          unit:units(name),
          comments:ticket_comments(
            *,
            user:profiles(name, email)
          ),
          attachments:ticket_attachments(
            *,
            uploader:profiles(name, email)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) {
        console.error('Error fetching ticket:', error)
        throw error
      }
      
      console.log('Ticket fetched:', data)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (ticket: TicketInsert) => {
      console.log('Creating ticket:', ticket)
      
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticket)
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email),
          unit:units(name)
        `)
        .single()
      
      if (error) {
        console.error('Error creating ticket:', error)
        throw error
      }
      
      console.log('Ticket created:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      toast({
        title: 'Sucesso',
        description: `Chamado #${data.ticket_number} criado com sucesso`,
      })
    },
    onError: (error) => {
      console.error('Error in createTicket mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao criar chamado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: TicketUpdate & { id: string }) => {
      console.log('Updating ticket:', { id, updates })
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email),
          unit:units(name)
        `)
        .single()
      
      if (error) {
        console.error('Error updating ticket:', error)
        throw error
      }
      
      console.log('Ticket updated:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
      toast({
        title: 'Sucesso',
        description: 'Chamado atualizado com sucesso',
      })
    },
    onError: (error) => {
      console.error('Error in updateTicket mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar chamado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

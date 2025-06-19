import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

type Ticket = Tables<'tickets'>
type TicketInsert = TablesInsert<'tickets'>
type TicketUpdate = TablesUpdate<'tickets'>

export function useTickets() {
  const { profile } = useAuth()
  const { data: technicianUnits = [] } = useTechnicianUnits(profile?.id)

  return useQuery({
    queryKey: ['tickets', profile?.id, profile?.role],
    queryFn: async () => {
      console.log('Fetching tickets for user:', profile?.role, profile?.id)
      
      let query = supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email),
          unit:units(name),
          attachments:ticket_attachments(
            *,
            uploader:profiles(name, email)
          )
        `)

      // Filtrar por unidades baseado no role
      if (profile?.role === 'technician') {
        const unitIds = technicianUnits.map(tu => tu.unit_id)
        
        if (unitIds.length > 0) {
          query = query.in('unit_id', unitIds)
        } else {
          // Se técnico não tem unidades atribuídas, não mostrar nada
          return []
        }
      }
      // Admin vê todos os chamados (sem filtro)
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching tickets:', error)
        throw error
      }
      
      // Adicionar URLs públicas aos anexos
      const ticketsWithUrls = data?.map(ticket => ({
        ...ticket,
        attachments: ticket.attachments?.map(attachment => {
          const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(attachment.file_path)
          
          return {
            ...attachment,
            public_url: urlData.publicUrl
          }
        }) || []
      })) || []
      
      console.log('Tickets fetched:', ticketsWithUrls.length, 'tickets for role:', profile?.role)
      return ticketsWithUrls
    },
    enabled: !!profile?.id,
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
      
      // Adicionar URLs públicas aos anexos
      const ticketWithUrls = {
        ...data,
        attachments: data.attachments?.map(attachment => {
          const { data: urlData } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(attachment.file_path)
          
          return {
            ...attachment,
            public_url: urlData.publicUrl
          }
        }) || []
      }
      
      console.log('Ticket fetched:', ticketWithUrls)
      return ticketWithUrls
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

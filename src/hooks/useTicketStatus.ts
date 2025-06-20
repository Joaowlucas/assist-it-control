
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type TicketStatus = Tables<'tickets'>['status']

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TicketStatus }) => {
      console.log('Updating ticket status:', { id, status })
      
      const updateData: any = { status }
      
      // Se o status for fechado, adicionar timestamp de resolução
      if (status === 'fechado') {
        updateData.resolved_at = new Date().toISOString()
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          requester:profiles(name, email),
          assignee:profiles(name, email),
          unit:units(name)
        `)
        .single()
      
      if (error) {
        console.error('Error updating ticket status:', error)
        throw error
      }
      
      console.log('Ticket status updated:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
      toast({
        title: 'Sucesso',
        description: `Status do chamado atualizado para ${data.status}`,
      })
    },
    onError: (error) => {
      console.error('Error in updateTicketStatus mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useAssignTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, assigneeId }: { id: string; assigneeId: string | null }) => {
      console.log('Assigning ticket:', { id, assigneeId })
      
      const updateData: any = { assignee_id: assigneeId }
      
      // Se está atribuindo um técnico e o status ainda está aberto, muda para em andamento
      if (assigneeId) {
        const { data: currentTicket } = await supabase
          .from('tickets')
          .select('status')
          .eq('id', id)
          .single()
        
        if (currentTicket?.status === 'aberto') {
          updateData.status = 'em_andamento'
        }
      }
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          requester:profiles(name, email),
          assignee:profiles(name, email),
          unit:units(name)
        `)
        .single()
      
      if (error) {
        console.error('Error assigning ticket:', error)
        throw error
      }
      
      console.log('Ticket assigned:', data)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] })
      toast({
        title: 'Sucesso',
        description: data.assignee ? 
          `Chamado atribuído para ${data.assignee.name}` : 
          'Atribuição removida do chamado',
      })
    },
    onError: (error) => {
      console.error('Error in assignTicket mutation:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atribuir chamado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

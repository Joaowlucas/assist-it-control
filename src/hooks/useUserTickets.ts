
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export type UserTicket = {
  id: string
  ticket_number: number
  title: string
  description: string
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'fechado'
  category: 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  created_at: string
  updated_at: string | null
  resolved_at: string | null
  requester_id: string
  assignee_id: string | null
  unit_id: string
  requester?: {
    id: string
    name: string
    email: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  unit?: {
    id: string
    name: string
  }
}

export function useUserTickets() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['user-tickets', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(id, name, email),
          assignee:profiles!tickets_assignee_id_fkey(id, name, email),
          unit:units(id, name)
        `)
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as UserTicket[]
    },
    enabled: !!profile?.id,
  })
}

export function useCreateUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (ticket: {
      title: string
      description: string
      category: 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
      priority: 'baixa' | 'media' | 'alta' | 'critica'
      unit_id?: string
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')
      
      const unitId = ticket.unit_id || profile?.unit_id
      if (!unitId) throw new Error('Unit not defined')
      
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          priority: ticket.priority,
          requester_id: profile.id,
          unit_id: unitId
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      toast({
        title: 'Sucesso',
        description: `Chamado #${data.ticket_number} criado com sucesso`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar chamado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      toast({
        title: 'Sucesso',
        description: 'Chamado atualizado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar chamado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteUserTicket() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-tickets'] })
      toast({
        title: 'Sucesso',
        description: 'Chamado excluído com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir chamado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

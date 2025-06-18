
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export type TicketCategory = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export function useTicketCategories() {
  return useQuery({
    queryKey: ['ticket-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data as TicketCategory[]
    },
  })
}

export function useCreateTicketCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (category: Omit<TicketCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .insert(category)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
      toast({
        title: 'Sucesso',
        description: 'Categoria criada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTicketCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TicketCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
      toast({
        title: 'Sucesso',
        description: 'Categoria atualizada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar categoria: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteTicketCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_categories')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
      toast({
        title: 'Sucesso',
        description: 'Categoria removida com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover categoria: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

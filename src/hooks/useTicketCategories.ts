
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface TicketCategory {
  id: string
  name: string
  description?: string
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
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
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
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
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
        title: 'Categoria excluída',
        description: 'A categoria foi desativada com sucesso.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useSetDefaultCategory() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // Primeiro, remove o padrão de todas as categorias
      await supabase
        .from('ticket_categories')
        .update({ is_default: false })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all records

      // Depois, define a nova categoria como padrão
      const { error } = await supabase
        .from('ticket_categories')
        .update({ is_default: true })
        .eq('id', categoryId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
      toast({
        title: 'Categoria padrão definida',
        description: 'A categoria foi definida como padrão.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao definir categoria padrão',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}


import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface TicketCategory {
  id: string
  name: string
  description: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useTicketCategories = () => {
  return useQuery({
    queryKey: ['ticket-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name')
      
      if (error) throw error
      return data as TicketCategory[]
    }
  })
}

export const useCreateTicketCategory = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (category: Omit<TicketCategory, 'id' | 'created_at' | 'updated_at' | 'is_default'>) => {
      const { data, error } = await supabase
        .from('ticket_categories')
        .insert({ ...category, is_default: false })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
      toast({
        title: "Categoria criada",
        description: "Nova categoria de chamado criada com sucesso!"
      })
    }
  })
}

export const useUpdateTicketCategory = () => {
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
        title: "Categoria atualizada",
        description: "Categoria de chamado atualizada com sucesso!"
      })
    }
  })
}

export const useDeleteTicketCategory = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Primeiro verificar se a categoria está sendo usada
      const { data: ticketsUsingCategory, error: checkError } = await supabase
        .from('tickets')
        .select('id')
        .eq('category', id)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (ticketsUsingCategory && ticketsUsingCategory.length > 0) {
        throw new Error('Não é possível excluir uma categoria que está sendo usada em chamados.')
      }
      
      const { error } = await supabase
        .from('ticket_categories')
        .update({ is_active: false })
        .eq('id', id)
        .eq('is_default', false) // Não permitir excluir categorias padrão
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-categories'] })
      toast({
        title: "Categoria removida",
        description: "Categoria de chamado removida com sucesso!"
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    }
  })
}

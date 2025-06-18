
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface TicketTemplate {
  id: string
  name: string
  category: string
  priority: string
  title_template: string
  description_template: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useTicketTemplates = () => {
  return useQuery({
    queryKey: ['ticket-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) throw error
      return data as TicketTemplate[]
    }
  })
}

export const useCreateTicketTemplate = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (template: Omit<TicketTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ticket_templates')
        .insert(template)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] })
      toast({
        title: "Template criado",
        description: "Template de chamado criado com sucesso!"
      })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao criar template: " + error.message,
        variant: "destructive"
      })
    }
  })
}

export const useUpdateTicketTemplate = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TicketTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('ticket_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] })
      toast({
        title: "Template atualizado",
        description: "Template de chamado atualizado com sucesso!"
      })
    }
  })
}

export const useDeleteTicketTemplate = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_templates')
        .update({ is_active: false })
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-templates'] })
      toast({
        title: "Template removido",
        description: "Template de chamado removido com sucesso!"
      })
    }
  })
}

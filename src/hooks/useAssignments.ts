
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          user:profiles!assignments_user_id_fkey(id, name, email),
          equipment:equipment!assignments_equipment_id_fkey(id, name, type, brand, model, tombamento)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (assignment: { id: string; [key: string]: any }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update(assignment)
        .eq('id', assignment.id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['active-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['monthly-returns'] })
      
      toast({
        title: 'Sucesso',
        description: 'Atribuição atualizada com sucesso.',
      })
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar atribuição:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar atribuição: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

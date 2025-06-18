
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useEndAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          status: 'finalizado',
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', assignmentId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      
      toast({
        title: 'Sucesso',
        description: 'Atribuição finalizada com sucesso. O equipamento agora está disponível para nova atribuição.',
      })
    },
    onError: (error: any) => {
      console.error('Erro ao finalizar atribuição:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao finalizar atribuição: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

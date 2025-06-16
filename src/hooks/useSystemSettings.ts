
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      console.log('Fetching system settings')
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()
      
      if (error) {
        console.error('Error fetching system settings:', error)
        throw error
      }
      
      console.log('System settings fetched:', data)
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (updateData: any) => {
      console.log('Updating system settings:', updateData)
      
      const { data, error } = await supabase
        .from('system_settings')
        .update(updateData)
        .eq('id', updateData.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating system settings:', error)
        throw error
      }

      console.log('System settings updated:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast({
        title: 'Configurações atualizadas!',
        description: 'As configurações do sistema foram salvas com sucesso.',
      })
    },
    onError: (error: any) => {
      console.error('Update system settings error:', error)
      toast({
        title: 'Erro ao salvar configurações',
        description: error.message || 'Erro ao atualizar as configurações do sistema.',
        variant: 'destructive',
      })
    },
  })
}

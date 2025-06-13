
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SystemSettings {
  id: string
  company_name: string
  company_logo_url: string | null
  department_name: string
  support_email: string
  ticket_email: string
  equipment_email: string
  auto_assign_tickets: boolean
  default_priority: string
  custom_primary_color: string | null
  custom_primary_foreground_color: string | null
  custom_secondary_color: string | null
  custom_secondary_foreground_color: string | null
  custom_foreground_color: string | null
  custom_muted_foreground_color: string | null
  custom_destructive_color: string | null
  custom_destructive_foreground_color: string | null
  enable_custom_colors: boolean
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()
      
      if (error) throw error
      return data as SystemSettings
    },
  })
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (settings: Partial<SystemSettings>) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update(settings)
        .eq('id', settings.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Erro ao salvar as configurações.",
        variant: "destructive",
      })
    },
  })
}

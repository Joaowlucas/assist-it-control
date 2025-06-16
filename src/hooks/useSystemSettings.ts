
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
  evolution_api_url: string | null
  evolution_api_token: string | null
  evolution_instance_name: string | null
  whatsapp_enabled: boolean
}

// Cache localStorage para system settings
const SETTINGS_CACHE_KEY = 'system_settings_cache'
const CACHE_DURATION = 30 * 60 * 1000 // Reduzido para 30 minutos

function getCachedSettings(): SystemSettings | null {
  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
      // Se o cache expirou, remove do localStorage
      localStorage.removeItem(SETTINGS_CACHE_KEY)
    }
  } catch (error) {
    console.error('Error reading cached settings:', error)
    localStorage.removeItem(SETTINGS_CACHE_KEY)
  }
  return null
}

function setCachedSettings(data: SystemSettings) {
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Error caching settings:', error)
  }
}

export function useSystemSettings() {
  const cachedData = getCachedSettings()
  
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      console.log('Fetching system settings from database...')
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()
      
      if (error) throw error
      
      // Cache os dados após buscar
      setCachedSettings(data as SystemSettings)
      return data as SystemSettings
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 24 * 60 * 60 * 1000, // 24 horas
    refetchOnMount: !cachedData, // Só refetch se não tiver cache válido
    refetchOnWindowFocus: false,
    refetchOnReconnect: true, // Ativado para reconectar
    initialData: cachedData, // Usar dados do cache como inicial
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
      
      // Atualizar cache após update
      setCachedSettings(data as SystemSettings)
      return data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['system-settings'], data)
      // Invalidar todas as queries que dependem das configurações
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

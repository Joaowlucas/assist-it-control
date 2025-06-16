
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

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


import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          user:user_id(id, name, email),
          equipment:equipment_id(id, name, type, brand, model, tombamento)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

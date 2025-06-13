
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useActiveAssignments() {
  return useQuery({
    queryKey: ['active-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          user:user_id(id, name, email),
          equipment:equipment_id(id, name, type, brand, model, tombamento)
        `)
        .eq('status', 'ativo')
        .order('start_date', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

export function useMonthlyReturns() {
  return useQuery({
    queryKey: ['monthly-returns'],
    queryFn: async () => {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          user:user_id(id, name, email),
          equipment:equipment_id(id, name, type, brand, model, tombamento)
        `)
        .eq('status', 'finalizado')
        .gte('end_date', startOfMonth.toISOString().split('T')[0])
        .order('end_date', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

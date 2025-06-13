
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function useAssignmentStats() {
  return useQuery({
    queryKey: ['assignment-stats'],
    queryFn: async () => {
      // Buscar atribuições ativas
      const { data: activeAssignments } = await supabase
        .from('assignments')
        .select(`
          *,
          equipment:equipment(id, name, type, brand, model, tombamento),
          user:profiles!assignments_user_id_fkey(name, email, unit:units(name)),
          assigned_by_user:profiles!assignments_assigned_by_fkey(name, email)
        `)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })

      // Buscar devoluções do mês atual
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString()
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString()

      const { data: monthlyReturns } = await supabase
        .from('assignments')
        .select(`
          *,
          equipment:equipment(id, name, type, brand, model, tombamento),
          user:profiles!assignments_user_id_fkey(name, email, unit:units(name)),
          assigned_by_user:profiles!assignments_assigned_by_fkey(name, email)
        `)
        .eq('status', 'finalizado')
        .gte('end_date', startOfMonth.split('T')[0])
        .lte('end_date', endOfMonth.split('T')[0])
        .order('end_date', { ascending: false })

      // Buscar todas as atribuições para histórico
      const { data: allAssignments } = await supabase
        .from('assignments')
        .select(`
          *,
          equipment:equipment(id, name, type, brand, model, tombamento),
          user:profiles!assignments_user_id_fkey(name, email, unit:units(name)),
          assigned_by_user:profiles!assignments_assigned_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false })

      return {
        activeAssignments: activeAssignments || [],
        monthlyReturns: monthlyReturns || [],
        allAssignments: allAssignments || []
      }
    },
  })
}

export function useMonthlyReturns() {
  return useQuery({
    queryKey: ['monthly-returns'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString()
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString()

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          equipment:equipment(id, name, type, brand, model, tombamento),
          user:profiles!assignments_user_id_fkey(name, email, unit:units(name)),
          assigned_by_user:profiles!assignments_assigned_by_fkey(name, email)
        `)
        .eq('status', 'finalizado')
        .gte('end_date', startOfMonth.split('T')[0])
        .lte('end_date', endOfMonth.split('T')[0])
        .order('end_date', { ascending: false })

      if (error) throw error
      
      // Calcular estatísticas
      const returns = data || []
      const avgUsageDays = returns.length > 0 
        ? returns.reduce((acc, assignment) => {
            const start = new Date(assignment.start_date)
            const end = new Date(assignment.end_date!)
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            return acc + days
          }, 0) / returns.length
        : 0

      return {
        returns,
        avgUsageDays: Math.round(avgUsageDays)
      }
    },
  })
}

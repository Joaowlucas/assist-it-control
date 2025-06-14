
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface DashboardStats {
  totalTickets: number
  openTickets: number
  totalEquipment: number
  availableEquipment: number
  totalUsers: number
  activeAssignments: number
  avgResolutionTime: number
  ticketsTrend: number
  equipmentTrend: number
  usersTrend: number
  resolutionTimeTrend: number
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Fetching dashboard stats...')
      
      // Buscar estatísticas de tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, status, created_at, resolved_at')
      
      const { data: openTicketsData } = await supabase
        .from('tickets')
        .select('id')
        .neq('status', 'fechado')
      
      // Buscar estatísticas de equipamentos
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('id, status, created_at')
      
      const { data: availableEquipmentData } = await supabase
        .from('equipment')
        .select('id')
        .eq('status', 'disponivel')
      
      // Buscar estatísticas de usuários
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, created_at, status')
        .eq('status', 'ativo')
      
      // Buscar atribuições ativas
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id')
        .eq('status', 'ativo')
      
      // Calcular tempo médio de resolução
      const resolvedTickets = ticketsData?.filter(t => t.resolved_at) || []
      const avgResolutionTime = resolvedTickets.length > 0 
        ? resolvedTickets.reduce((acc, ticket) => {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.resolved_at!)
            const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
            return acc + hours
          }, 0) / resolvedTickets.length
        : 0
      
      // Calcular tendências (comparação com mês anterior)
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      
      const lastMonthTickets = ticketsData?.filter(t => 
        new Date(t.created_at) >= oneMonthAgo
      ).length || 0
      
      const previousMonthTickets = ticketsData?.filter(t => {
        const date = new Date(t.created_at)
        const twoMonthsAgo = new Date()
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)
        return date >= twoMonthsAgo && date < oneMonthAgo
      }).length || 0
      
      const ticketsTrend = previousMonthTickets > 0 
        ? ((lastMonthTickets - previousMonthTickets) / previousMonthTickets) * 100
        : 0
      
      return {
        totalTickets: ticketsData?.length || 0,
        openTickets: openTicketsData?.length || 0,
        totalEquipment: equipmentData?.length || 0,
        availableEquipment: availableEquipmentData?.length || 0,
        totalUsers: usersData?.length || 0,
        activeAssignments: assignmentsData?.length || 0,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        ticketsTrend: Math.round(ticketsTrend),
        equipmentTrend: 2, // Mock para equipamentos
        usersTrend: 8, // Mock para usuários  
        resolutionTimeTrend: -15 // Mock para tempo de resolução
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos 
    refetchInterval: false, // Não refetch automático
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  })
}

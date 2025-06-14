
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

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
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)

  return useQuery({
    queryKey: ['dashboard-stats', profile?.id, profile?.role, technicianUnits],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Fetching dashboard stats...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []
      
      // Buscar estatísticas de tickets
      let ticketsQuery = supabase
        .from('tickets')
        .select('id, status, created_at, resolved_at, unit_id')
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        ticketsQuery = ticketsQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: ticketsData } = await ticketsQuery
      
      let openTicketsQuery = supabase
        .from('tickets')
        .select('id')
        .neq('status', 'fechado')
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        openTicketsQuery = openTicketsQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: openTicketsData } = await openTicketsQuery
      
      // Buscar estatísticas de equipamentos
      let equipmentQuery = supabase
        .from('equipment')
        .select('id, status, created_at, unit_id')
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        equipmentQuery = equipmentQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: equipmentData } = await equipmentQuery
      
      let availableEquipmentQuery = supabase
        .from('equipment')
        .select('id')
        .eq('status', 'disponivel')
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        availableEquipmentQuery = availableEquipmentQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: availableEquipmentData } = await availableEquipmentQuery
      
      // Buscar estatísticas de usuários
      let usersQuery = supabase
        .from('profiles')
        .select('id, created_at, status, unit_id')
        .eq('status', 'ativo')
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        usersQuery = usersQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: usersData } = await usersQuery
      
      // Buscar atribuições ativas (filtrar por equipamentos das unidades do técnico)
      let assignmentsQuery = supabase
        .from('assignments')
        .select(`
          id,
          equipment:equipment!assignments_equipment_id_fkey(unit_id)
        `)
        .eq('status', 'ativo')
      
      const { data: assignmentsData } = await assignmentsQuery
      
      // Filtrar atribuições se for técnico
      const filteredAssignments = shouldFilterByUnits && allowedUnitIds.length > 0
        ? (assignmentsData || []).filter((assignment: any) => 
            allowedUnitIds.includes(assignment.equipment?.unit_id)
          )
        : assignmentsData || []
      
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
        activeAssignments: filteredAssignments.length,
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
    enabled: !!profile, // Only run when profile is loaded
  })
}

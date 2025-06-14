
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

interface ChartData {
  ticketsByMonth: Array<{ month: string; abertos: number; fechados: number }>
  equipmentStatus: Array<{ name: string; value: number; color: string }>
  ticketsByPriority: Array<{ priority: string; count: number }>
  ticketsByCategory: Array<{ category: string; count: number }>
  resolutionTrend: Array<{ month: string; avgTime: number }>
}

export function useDashboardCharts() {
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)

  return useQuery({
    queryKey: ['dashboard-charts', profile?.id, profile?.role, technicianUnits],
    queryFn: async (): Promise<ChartData> => {
      console.log('Fetching dashboard charts data...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []
      
      // Buscar tickets dos últimos 6 meses
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      let ticketsQuery = supabase
        .from('tickets')
        .select('id, status, priority, category, created_at, resolved_at, unit_id')
        .gte('created_at', sixMonthsAgo.toISOString())
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        ticketsQuery = ticketsQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: ticketsData } = await ticketsQuery
      
      // Buscar equipamentos
      let equipmentQuery = supabase
        .from('equipment')
        .select('id, status, unit_id')
      
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        equipmentQuery = equipmentQuery.in('unit_id', allowedUnitIds)
      }
      
      const { data: equipmentData } = await equipmentQuery
      
      // Processar dados de tickets por mês
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const ticketsByMonth = []
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const month = monthNames[date.getMonth()]
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthTickets = ticketsData?.filter(t => {
          const ticketDate = new Date(t.created_at)
          return ticketDate >= monthStart && ticketDate <= monthEnd
        }) || []
        
        const abertos = monthTickets.length
        const fechados = monthTickets.filter(t => t.status === 'fechado').length
        
        ticketsByMonth.push({ month, abertos, fechados })
      }
      
      // Processar status dos equipamentos
      const equipmentStatusCount = {
        disponivel: 0,
        em_uso: 0,
        manutencao: 0,
        descartado: 0
      }
      
      equipmentData?.forEach(eq => {
        if (equipmentStatusCount.hasOwnProperty(eq.status)) {
          equipmentStatusCount[eq.status as keyof typeof equipmentStatusCount]++
        }
      })
      
      const equipmentStatus = [
        { name: 'Disponível', value: equipmentStatusCount.disponivel, color: '#22c55e' },
        { name: 'Em Uso', value: equipmentStatusCount.em_uso, color: '#3b82f6' },
        { name: 'Manutenção', value: equipmentStatusCount.manutencao, color: '#f59e0b' },
        { name: 'Descartado', value: equipmentStatusCount.descartado, color: '#ef4444' },
      ]
      
      // Processar tickets por prioridade
      const priorityCount = { baixa: 0, media: 0, alta: 0, critica: 0 }
      ticketsData?.forEach(ticket => {
        if (priorityCount.hasOwnProperty(ticket.priority)) {
          priorityCount[ticket.priority as keyof typeof priorityCount]++
        }
      })
      
      const ticketsByPriority = [
        { priority: 'Baixa', count: priorityCount.baixa },
        { priority: 'Média', count: priorityCount.media },
        { priority: 'Alta', count: priorityCount.alta },
        { priority: 'Crítica', count: priorityCount.critica },
      ]
      
      // Processar tickets por categoria
      const categoryCount = { hardware: 0, software: 0, rede: 0, acesso: 0, outros: 0 }
      ticketsData?.forEach(ticket => {
        if (categoryCount.hasOwnProperty(ticket.category)) {
          categoryCount[ticket.category as keyof typeof categoryCount]++
        }
      })
      
      const ticketsByCategory = [
        { category: 'Hardware', count: categoryCount.hardware },
        { category: 'Software', count: categoryCount.software },
        { category: 'Rede', count: categoryCount.rede },
        { category: 'Acesso', count: categoryCount.acesso },
        { category: 'Outros', count: categoryCount.outros },
      ]
      
      // Tendência de resolução (mock por enquanto)
      const resolutionTrend = ticketsByMonth.map(item => ({
        month: item.month,
        avgTime: Math.random() * 3 + 1 // 1-4 horas
      }))
      
      return {
        ticketsByMonth,
        equipmentStatus,
        ticketsByPriority,
        ticketsByCategory,
        resolutionTrend
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
    enabled: !!profile, // Only run when profile is loaded
  })
}

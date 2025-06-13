
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface ChartData {
  ticketsByMonth: Array<{ month: string; abertos: number; fechados: number }>
  equipmentStatus: Array<{ name: string; value: number; color: string }>
  ticketsByPriority: Array<{ priority: string; count: number }>
  ticketsByCategory: Array<{ category: string; count: number }>
  resolutionTrend: Array<{ month: string; avgTime: number }>
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async (): Promise<ChartData> => {
      console.log('Fetching dashboard charts data...')
      
      // Buscar tickets dos últimos 6 meses
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, status, priority, category, created_at, resolved_at')
        .gte('created_at', sixMonthsAgo.toISOString())
      
      // Buscar equipamentos
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select('id, status')
      
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
  })
}

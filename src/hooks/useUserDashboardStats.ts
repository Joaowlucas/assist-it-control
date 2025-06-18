
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useUserTickets } from '@/hooks/useUserTickets'
import { useUserAssignments } from '@/hooks/useUserAssignments'

export function useUserDashboardStats() {
  const { profile } = useAuth()
  const { data: tickets = [] } = useUserTickets()
  const { data: assignments = [] } = useUserAssignments()

  return useQuery({
    queryKey: ['user-dashboard-stats', profile?.id],
    queryFn: async () => {
      const openTickets = tickets.filter(t => t.status === 'aberto').length
      const inProgressTickets = tickets.filter(t => t.status === 'em_andamento').length
      const closedTickets = tickets.filter(t => t.status === 'fechado').length
      const totalTickets = tickets.length

      const activeAssignments = assignments.filter(a => a.status === 'ativo').length
      const finishedAssignments = assignments.filter(a => a.status === 'finalizado').length
      const totalAssignments = assignments.length

      // Estatísticas por prioridade
      const highPriorityTickets = tickets.filter(t => t.priority === 'alta').length
      const mediumPriorityTickets = tickets.filter(t => t.priority === 'media').length
      const lowPriorityTickets = tickets.filter(t => t.priority === 'baixa').length

      return {
        tickets: {
          open: openTickets,
          inProgress: inProgressTickets,
          closed: closedTickets,
          total: totalTickets,
          byPriority: {
            high: highPriorityTickets,
            medium: mediumPriorityTickets,
            low: lowPriorityTickets
          }
        },
        assignments: {
          active: activeAssignments,
          finished: finishedAssignments,
          total: totalAssignments
        }
      }
    },
    enabled: !!profile?.id,
  })
}

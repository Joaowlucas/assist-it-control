
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface TechnicianPerformance {
  id: string
  name: string
  totalAssigned: number
  totalResolved: number
  avgResolutionTime: number
  activeTickets: number
}

interface UnitReport {
  id: string
  name: string
  totalTickets: number
  openTickets: number
  totalEquipment: number
  activeAssignments: number
}

interface EquipmentReport {
  id: string
  name: string
  type: string
  status: string
  currentUser?: string
  assignmentDate?: string
  usageDays?: number
}

interface DashboardReports {
  technicianPerformance: TechnicianPerformance[]
  unitReports: UnitReport[]
  equipmentReports: EquipmentReport[]
  topIssues: Array<{ category: string; count: number; avgResolutionTime: number }>
}

export function useDashboardReports(dateRange?: { start: Date; end: Date }) {
  return useQuery({
    queryKey: ['dashboard-reports', dateRange],
    queryFn: async (): Promise<DashboardReports> => {
      console.log('Fetching dashboard reports...')
      
      // Definir range de datas (último mês se não especificado)
      const endDate = dateRange?.end || new Date()
      const startDate = dateRange?.start || (() => {
        const date = new Date()
        date.setMonth(date.getMonth() - 1)
        return date
      })()
      
      // Buscar dados de tickets com relacionamentos
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select(`
          id, status, priority, category, created_at, resolved_at, assignee_id,
          assignee:profiles!tickets_assignee_id_fkey(id, name),
          requester:profiles!tickets_requester_id_fkey(id, name),
          unit:units(id, name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      // Buscar todos os técnicos
      const { data: techniciansData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('role', ['admin', 'technician'])
      
      // Buscar unidades com dados relacionados
      const { data: unitsData } = await supabase
        .from('units')
        .select(`
          id, name,
          tickets(id, status),
          equipment(id, status),
          assignments(id, status)
        `)
      
      // Buscar equipamentos com atribuições
      const { data: equipmentData } = await supabase
        .from('equipment')
        .select(`
          id, name, type, status,
          assignments(
            id, status, start_date,
            user:profiles(id, name)
          )
        `)
      
      // Processar performance dos técnicos
      const technicianPerformance: TechnicianPerformance[] = techniciansData?.map(tech => {
        const assignedTickets = ticketsData?.filter(t => t.assignee_id === tech.id) || []
        const resolvedTickets = assignedTickets.filter(t => t.status === 'fechado')
        const activeTickets = assignedTickets.filter(t => t.status !== 'fechado')
        
        const avgResolutionTime = resolvedTickets.length > 0
          ? resolvedTickets.reduce((acc, ticket) => {
              if (ticket.resolved_at) {
                const created = new Date(ticket.created_at)
                const resolved = new Date(ticket.resolved_at)
                const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
                return acc + hours
              }
              return acc
            }, 0) / resolvedTickets.length
          : 0
        
        return {
          id: tech.id,
          name: tech.name,
          totalAssigned: assignedTickets.length,
          totalResolved: resolvedTickets.length,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          activeTickets: activeTickets.length
        }
      }) || []
      
      // Processar relatórios por unidade
      const unitReports: UnitReport[] = unitsData?.map(unit => ({
        id: unit.id,
        name: unit.name,
        totalTickets: unit.tickets?.length || 0,
        openTickets: unit.tickets?.filter((t: any) => t.status !== 'fechado').length || 0,
        totalEquipment: unit.equipment?.length || 0,
        activeAssignments: unit.assignments?.filter((a: any) => a.status === 'ativo').length || 0
      })) || []
      
      // Processar relatórios de equipamentos
      const equipmentReports: EquipmentReport[] = equipmentData?.map(eq => {
        const activeAssignment = eq.assignments?.find((a: any) => a.status === 'ativo')
        
        let usageDays: number | undefined
        if (activeAssignment?.start_date) {
          const startDate = new Date(activeAssignment.start_date)
          const today = new Date()
          usageDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        }
        
        return {
          id: eq.id,
          name: eq.name,
          type: eq.type,
          status: eq.status,
          currentUser: activeAssignment?.user?.name,
          assignmentDate: activeAssignment?.start_date,
          usageDays
        }
      }) || []
      
      // Processar principais problemas
      const categoryStats = ticketsData?.reduce((acc, ticket) => {
        if (!acc[ticket.category]) {
          acc[ticket.category] = { count: 0, totalTime: 0, resolvedCount: 0 }
        }
        acc[ticket.category].count++
        
        if (ticket.resolved_at) {
          const created = new Date(ticket.created_at)
          const resolved = new Date(ticket.resolved_at)
          const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
          acc[ticket.category].totalTime += hours
          acc[ticket.category].resolvedCount++
        }
        
        return acc
      }, {} as Record<string, { count: number; totalTime: number; resolvedCount: number }>)
      
      const topIssues = Object.entries(categoryStats || {}).map(([category, stats]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        count: stats.count,
        avgResolutionTime: stats.resolvedCount > 0 
          ? Math.round((stats.totalTime / stats.resolvedCount) * 10) / 10
          : 0
      })).sort((a, b) => b.count - a.count)
      
      return {
        technicianPerformance,
        unitReports,
        equipmentReports,
        topIssues
      }
    },
    refetchInterval: 120000, // Atualizar a cada 2 minutos
  })
}


import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface TechnicianReport {
  id: string
  name: string
  totalTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  resolutionRate: number
}

interface UnitReport {
  id: string
  name: string
  totalTickets: number
  openTickets: number
  totalEquipment: number
  availableEquipment: number
}

interface EquipmentReport {
  id: string
  name: string
  type: string
  status: string
  assignedTo?: string
  unit?: string
  lastMaintenance?: string
}

interface TopIssuesReport {
  category: string
  count: number
  avgResolutionTime: number
  priority: string
}

interface DashboardReports {
  technicianReports: TechnicianReport[]
  unitReports: UnitReport[]
  equipmentReports: EquipmentReport[]
  topIssues: TopIssuesReport[]
  loading: boolean
  error: any
}

export function useDashboardReports() {
  return useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async (): Promise<DashboardReports> => {
      console.log('Fetching dashboard reports...')
      
      try {
        // Buscar relatório de técnicos
        const { data: techniciansData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('role', ['technician', 'admin'])
        
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('assignee_id, status, created_at, resolved_at')
        
        // Processar dados dos técnicos
        const technicianReports: TechnicianReport[] = (techniciansData || []).map(tech => {
          const techTickets = (ticketsData || []).filter(t => t.assignee_id === tech.id)
          const resolvedTickets = techTickets.filter(t => t.status === 'fechado')
          
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
            totalTickets: techTickets.length,
            resolvedTickets: resolvedTickets.length,
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
            resolutionRate: techTickets.length > 0 ? Math.round((resolvedTickets.length / techTickets.length) * 100) : 0
          }
        })
        
        // Buscar relatório de unidades
        const { data: unitsData } = await supabase
          .from('units')
          .select(`
            id, 
            name,
            tickets:tickets(id, status),
            equipment:equipment(id, status)
          `)
        
        const unitReports: UnitReport[] = (unitsData || []).map(unit => {
          const tickets = unit.tickets || []
          const equipment = unit.equipment || []
          
          return {
            id: unit.id,
            name: unit.name,
            totalTickets: tickets.length,
            openTickets: tickets.filter((t: any) => t.status !== 'fechado').length,
            totalEquipment: equipment.length,
            availableEquipment: equipment.filter((e: any) => e.status === 'disponivel').length
          }
        })
        
        // Buscar relatório de equipamentos
        const { data: equipmentData } = await supabase
          .from('equipment')
          .select(`
            id,
            name,
            type,
            status,
            unit:units(name),
            assignments:assignments(
              user:profiles(name),
              status
            )
          `)
        
        const equipmentReports: EquipmentReport[] = (equipmentData || []).map(eq => {
          const activeAssignment = eq.assignments?.find((a: any) => a.status === 'ativo')
          
          return {
            id: eq.id,
            name: eq.name,
            type: eq.type,
            status: eq.status,
            assignedTo: activeAssignment?.user?.name,
            unit: eq.unit?.name,
            lastMaintenance: undefined // Pode ser implementado depois
          }
        })
        
        // Buscar top issues
        const { data: issuesData } = await supabase
          .from('tickets')
          .select('category, priority, created_at, resolved_at')
        
        const categoryGroups = (issuesData || []).reduce((acc: any, ticket) => {
          if (!acc[ticket.category]) {
            acc[ticket.category] = []
          }
          acc[ticket.category].push(ticket)
          return acc
        }, {})
        
        const topIssues: TopIssuesReport[] = Object.entries(categoryGroups).map(([category, tickets]: [string, any]) => {
          const resolvedTickets = tickets.filter((t: any) => t.resolved_at)
          const avgResolutionTime = resolvedTickets.length > 0
            ? resolvedTickets.reduce((acc: number, ticket: any) => {
                const created = new Date(ticket.created_at)
                const resolved = new Date(ticket.resolved_at)
                const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
                return acc + hours
              }, 0) / resolvedTickets.length
            : 0
          
          // Determinar prioridade mais comum
          const priorities = tickets.map((t: any) => t.priority)
          const priorityCount = priorities.reduce((acc: any, p: string) => {
            acc[p] = (acc[p] || 0) + 1
            return acc
          }, {})
          const mostCommonPriority = Object.entries(priorityCount)
            .sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 'media'
          
          return {
            category,
            count: tickets.length,
            avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
            priority: mostCommonPriority
          }
        }).sort((a, b) => b.count - a.count)
        
        return {
          technicianReports,
          unitReports,
          equipmentReports,
          topIssues,
          loading: false,
          error: null
        }
        
      } catch (error) {
        console.error('Error fetching dashboard reports:', error)
        return {
          technicianReports: [],
          unitReports: [],
          equipmentReports: [],
          topIssues: [],
          loading: false,
          error
        }
      }
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  })
}

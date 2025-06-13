
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface EquipmentStats {
  total: number
  available: number
  inUse: number
  maintenance: number
  disposed: number
  byType: Array<{ type: string; count: number }>
  byUnit: Array<{ unit: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
}

export function useEquipmentStats() {
  return useQuery({
    queryKey: ['equipment-stats'],
    queryFn: async () => {
      // Get equipment with units
      const { data: equipment, error } = await supabase
        .from('equipment')
        .select(`
          *,
          unit:units(name)
        `)

      if (error) throw error

      const stats: EquipmentStats = {
        total: equipment.length,
        available: equipment.filter(e => e.status === 'disponivel').length,
        inUse: equipment.filter(e => e.status === 'em_uso').length,
        maintenance: equipment.filter(e => e.status === 'manutencao').length,
        disposed: equipment.filter(e => e.status === 'descartado').length,
        byType: [],
        byUnit: [],
        byStatus: []
      }

      // Group by type
      const typeGroups = equipment.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      stats.byType = Object.entries(typeGroups).map(([type, count]) => ({
        type,
        count
      }))

      // Group by unit
      const unitGroups = equipment.reduce((acc, item) => {
        const unitName = item.unit?.name || 'Sem unidade'
        acc[unitName] = (acc[unitName] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      stats.byUnit = Object.entries(unitGroups).map(([unit, count]) => ({
        unit,
        count
      }))

      // Group by status
      const statusGroups = equipment.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      stats.byStatus = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        count
      }))

      return stats
    }
  })
}

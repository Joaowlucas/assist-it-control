
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
      console.log('📊 Fetching equipment stats...')
      
      try {
        // Get equipment with units
        const { data: equipment, error } = await supabase
          .from('equipment')
          .select(`
            *,
            unit:units(name)
          `)

        if (error) {
          console.error('❌ Error fetching equipment for stats:', error)
          throw error
        }

        console.log('📊 Equipment data for stats:', equipment?.length || 0, 'items')

        const stats: EquipmentStats = {
          total: equipment?.length || 0,
          available: equipment?.filter(e => e.status === 'disponivel').length || 0,
          inUse: equipment?.filter(e => e.status === 'em_uso').length || 0,
          maintenance: equipment?.filter(e => e.status === 'manutencao').length || 0,
          disposed: equipment?.filter(e => e.status === 'descartado').length || 0,
          byType: [],
          byUnit: [],
          byStatus: []
        }

        // Only process groupings if we have equipment
        if (equipment && equipment.length > 0) {
          // Group by type
          const typeGroups = equipment.reduce((acc, item) => {
            if (item.type) {
              acc[item.type] = (acc[item.type] || 0) + 1
            }
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
            if (item.status) {
              acc[item.status] = (acc[item.status] || 0) + 1
            }
            return acc
          }, {} as Record<string, number>)

          stats.byStatus = Object.entries(statusGroups).map(([status, count]) => ({
            status,
            count
          }))
        }

        console.log('✅ Calculated equipment stats:', stats)
        return stats
      } catch (error) {
        console.error('❌ Equipment stats fetch error:', error)
        // Return empty stats instead of throwing to prevent UI breakage
        return {
          total: 0,
          available: 0,
          inUse: 0,
          maintenance: 0,
          disposed: 0,
          byType: [],
          byUnit: [],
          byStatus: []
        }
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
  })
}

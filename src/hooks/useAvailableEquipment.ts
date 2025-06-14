
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

export interface AvailableEquipment {
  id: string
  name: string
  type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  tombamento: string | null
  location: string | null
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'descartado'
  unit?: {
    name: string
  }
}

export function useAvailableEquipment() {
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)

  return useQuery({
    queryKey: ['available-equipment', profile?.id, profile?.role, technicianUnits],
    queryFn: async () => {
      console.log('Fetching available equipment data...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []

      let query = supabase
        .from('equipment')
        .select(`
          id,
          name,
          type,
          brand,
          model,
          serial_number,
          tombamento,
          location,
          status,
          unit:units(name)
        `)
        .eq('status', 'disponivel')

      // Apply unit filter for technicians
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        query = query.in('unit_id', allowedUnitIds)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) throw error
      return data as AvailableEquipment[]
    },
    enabled: !!profile, // Only run when profile is loaded
  })
}

export function useEquipmentByType(equipmentType: string) {
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)

  return useQuery({
    queryKey: ['equipment-by-type', equipmentType, profile?.id, profile?.role, technicianUnits],
    queryFn: async () => {
      console.log('Fetching equipment by type data...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []

      let query = supabase
        .from('equipment')
        .select(`
          id,
          name,
          type,
          brand,
          model,
          serial_number,
          tombamento,
          location,
          status,
          unit:units(name)
        `)
        .eq('status', 'disponivel')
        .ilike('type', `%${equipmentType}%`)

      // Apply unit filter for technicians
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        query = query.in('unit_id', allowedUnitIds)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) throw error
      return data as AvailableEquipment[]
    },
    enabled: !!equipmentType && !!profile,
  })
}

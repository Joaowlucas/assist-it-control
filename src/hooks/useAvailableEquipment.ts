
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AvailableEquipment {
  id: string
  name: string
  type: string
  brand: string | null
  model: string | null
  serial_number: string | null
  status: 'disponivel' | 'em_uso' | 'manutencao' | 'descartado'
  unit?: {
    name: string
  }
}

export function useAvailableEquipment() {
  return useQuery({
    queryKey: ['available-equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          id,
          name,
          type,
          brand,
          model,
          serial_number,
          status,
          unit:units(name)
        `)
        .eq('status', 'disponivel')
        .order('name', { ascending: true })

      if (error) throw error
      return data as AvailableEquipment[]
    },
  })
}

export function useEquipmentByType(equipmentType: string) {
  return useQuery({
    queryKey: ['equipment-by-type', equipmentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          id,
          name,
          type,
          brand,
          model,
          serial_number,
          status,
          unit:units(name)
        `)
        .eq('status', 'disponivel')
        .ilike('type', `%${equipmentType}%`)
        .order('name', { ascending: true })

      if (error) throw error
      return data as AvailableEquipment[]
    },
    enabled: !!equipmentType,
  })
}

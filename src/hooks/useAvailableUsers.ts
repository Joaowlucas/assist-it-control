
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface AvailableUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  status: string
  unit?: {
    name: string
  }
  unit_id?: string
}

export function useAvailableUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-users', profile?.id, profile?.role],
    queryFn: async () => {
      console.log('Fetching available users for:', profile?.role)
      
      let query = supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          status,
          unit_id,
          unit:units(name)
        `)
        .eq('status', 'ativo')
        .order('name', { ascending: true })

      // Se for técnico, filtrar apenas usuários das unidades que ele atende
      if (profile?.role === 'technician') {
        // Buscar as unidades do técnico primeiro
        const { data: technicianUnits, error: unitsError } = await supabase
          .from('technician_units')
          .select('unit_id')
          .eq('technician_id', profile.id)

        if (unitsError) {
          console.error('Error fetching technician units:', unitsError)
          throw unitsError
        }

        if (technicianUnits && technicianUnits.length > 0) {
          const unitIds = technicianUnits.map(tu => tu.unit_id)
          console.log('Technician unit IDs:', unitIds)
          query = query.in('unit_id', unitIds)
        } else {
          // Se o técnico não tem unidades atribuídas, retornar array vazio
          console.log('Technician has no assigned units')
          return []
        }
      }
      
      // Admin vê todos os usuários (sem filtro adicional)
      // User não deveria usar esta função, mas se usar, vê todos
      
      const { data, error } = await query

      if (error) {
        console.error('Error fetching available users:', error)
        throw error
      }
      
      console.log('Available users fetched:', data?.length)
      return data as AvailableUser[]
    },
    enabled: !!profile?.id,
  })
}

export function useUsersByUnit(unitId: string) {
  return useQuery({
    queryKey: ['users-by-unit', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          status,
          unit_id,
          unit:units(name)
        `)
        .eq('status', 'ativo')
        .eq('unit_id', unitId)
        .order('name', { ascending: true })

      if (error) throw error
      return data as AvailableUser[]
    },
    enabled: !!unitId,
  })
}

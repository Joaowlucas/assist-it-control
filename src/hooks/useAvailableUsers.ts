
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AvailableUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  status: string
  unit?: {
    name: string
  }
}

export function useAvailableUsers() {
  return useQuery({
    queryKey: ['available-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          status,
          unit:units(name)
        `)
        .eq('status', 'ativo')
        .order('name', { ascending: true })

      if (error) throw error
      return data as AvailableUser[]
    },
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

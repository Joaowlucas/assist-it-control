import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AvailableUser {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  unit_id: string
}

export function useAvailableUsers() {
  return useQuery({
    queryKey: ['available-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_url, unit_id')
        .eq('status', 'ativo')
        .order('name', { ascending: true })

      if (error) throw error
      return data as AvailableUser[]
    },
  })
}
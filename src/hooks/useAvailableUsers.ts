
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export function useAvailableUsers() {
  const { profile } = useAuth()

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: ['available-users', profile?.unit_id],
    queryFn: async () => {
      if (!profile?.unit_id) return []

      let query = supabase
        .from('profiles')
        .select('id, name, email, avatar_url, unit_id, role')
        .eq('status', 'ativo')
        .neq('id', profile.id)

      // If not admin, only show users from same unit
      if (profile.role !== 'admin') {
        query = query.eq('unit_id', profile.unit_id)
      }

      const { data, error } = await query.order('name')

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }

      return data
    },
    enabled: !!profile?.unit_id
  })

  return { users, loading }
}

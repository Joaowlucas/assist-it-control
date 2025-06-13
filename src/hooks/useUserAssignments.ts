
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface UserAssignment {
  id: string
  start_date: string
  end_date: string | null
  status: 'ativo' | 'finalizado'
  notes: string | null
  equipment: {
    id: string
    name: string
    type: string
    brand: string | null
    model: string | null
    serial_number: string | null
  }
}

export function useUserAssignments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-assignments', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          start_date,
          end_date,
          status,
          notes,
          equipment:equipment(
            id,
            name,
            type,
            brand,
            model,
            serial_number
          )
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data as UserAssignment[]
    },
    enabled: !!user,
  })
}

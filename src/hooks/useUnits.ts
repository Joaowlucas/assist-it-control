
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Unit {
  id: string
  name: string
  description?: string
  address?: string
  created_at: string
  updated_at: string
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Unit[]
    },
  })
}

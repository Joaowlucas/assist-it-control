
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Profile {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  status: string
  unit_id: string | null
  avatar_url: string | null
  phone: string | null
  created_at: string | null
  updated_at: string | null
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'ativo')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Profile[]
    },
  })
}

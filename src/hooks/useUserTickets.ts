
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export type UserTicket = {
  id: string
  ticket_number: number
  title: string
  description: string
  status: 'aberto' | 'em_andamento' | 'aguardando' | 'fechado'
  category: 'hardware' | 'software' | 'rede' | 'acesso' | 'outros'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  created_at: string | null
  updated_at: string | null
  resolved_at: string | null
  requester_id: string
  assignee_id: string | null
  unit_id: string
  requester?: {
    name: string
    email: string
  }
  assignee?: {
    name: string
    email: string
  }
}

export function useUserTickets() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['user-tickets', profile?.id],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(name, email),
          assignee:profiles!tickets_assignee_id_fkey(name, email)
        `)
        .eq('requester_id', profile.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as UserTicket[]
    },
    enabled: !!profile?.id,
  })
}

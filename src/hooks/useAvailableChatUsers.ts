
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface AvailableChatUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'technician' | 'user'
  status: string
  unit_id: string | null
  avatar_url: string | null
  units?: {
    name: string
  }
}

export function useAvailableChatUsers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['available-chat-users', profile?.id, profile?.role, profile?.unit_id],
    queryFn: async () => {
      if (!profile?.id) return []

      console.log('Fetching available users for chat - User role:', profile.role, 'Unit:', profile.unit_id)

      let query = supabase
        .from('profiles')
        .select('id, name, email, role, status, unit_id, avatar_url, units(name)')
        .eq('status', 'ativo')
        .neq('id', profile.id)

      // Aplicar filtro baseado no role do usuário atual
      if (profile.role === 'user') {
        // Usuários comuns: apenas admins + técnicos da mesma unidade
        if (profile.unit_id) {
          query = query.or(`role.eq.admin,and(role.eq.technician,unit_id.eq.${profile.unit_id})`)
        } else {
          // Se não tem unidade, só pode conversar com admins
          query = query.eq('role', 'admin')
        }
      } else if (profile.role === 'technician') {
        // Técnicos: admins + usuários/técnicos das unidades que atendem
        const { data: techUnits } = await supabase
          .from('technician_units')
          .select('unit_id')
          .eq('technician_id', profile.id)

        const unitIds = techUnits?.map(tu => tu.unit_id) || []
        if (profile.unit_id && !unitIds.includes(profile.unit_id)) {
          unitIds.push(profile.unit_id)
        }

        if (unitIds.length > 0) {
          const unitFilters = unitIds.map(id => `unit_id.eq.${id}`).join(',')
          query = query.or(`role.eq.admin,${unitFilters},role.eq.technician`)
        } else {
          query = query.or('role.eq.admin,role.eq.technician')
        }
      }
      // Admins podem conversar com qualquer pessoa (sem filtro adicional)

      const { data, error } = await query.order('name')

      if (error) {
        console.error('Error fetching available users:', error)
        throw error
      }

      console.log('Available users fetched:', data?.length || 0, 'users')
      return (data as AvailableChatUser[]) || []
    },
    enabled: !!profile?.id,
  })
}

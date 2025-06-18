
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (updates: { id: string; [key: string]: any }) => {
      const { id, ...profileUpdates } = updates
      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

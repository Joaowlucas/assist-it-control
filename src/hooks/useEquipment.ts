
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type Equipment = Tables<'equipment'>
type EquipmentInsert = TablesInsert<'equipment'>
type EquipmentUpdate = TablesUpdate<'equipment'>

export function useEquipment() {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          unit:units(name)
        `)
        .order('name')
      
      if (error) throw error
      return data
    },
  })
}

export function useCreateEquipment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (equipment: EquipmentInsert) => {
      const { data, error } = await supabase
        .from('equipment')
        .insert(equipment)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Equipamento criado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar equipamento: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: EquipmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('equipment')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Equipamento atualizado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar equipamento: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

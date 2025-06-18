
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type Unit = Tables<'units'>
type UnitInsert = TablesInsert<'units'>
type UnitUpdate = TablesUpdate<'units'>

export function useCreateUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (unit: UnitInsert) => {
      const { data, error } = await supabase
        .from('units')
        .insert(unit)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast({
        title: 'Sucesso',
        description: 'Unidade criada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar unidade: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UnitUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast({
        title: 'Sucesso',
        description: 'Unidade atualizada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar unidade: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast({
        title: 'Sucesso',
        description: 'Unidade excluída com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir unidade: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

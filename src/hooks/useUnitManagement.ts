
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface CreateUnitData {
  name: string
  description: string
}

interface UpdateUnitData {
  id: string
  name?: string
  description?: string
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (unitData: CreateUnitData) => {
      const { data, error } = await supabase
        .from('units')
        .insert([unitData])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast({
        title: "Unidade criada com sucesso!",
        description: `A unidade ${data.name} foi adicionada.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar unidade",
        description: error.message || "Erro ao criar a unidade.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateUnitData) => {
      const { data, error } = await supabase
        .from('units')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast({
        title: "Unidade atualizada!",
        description: `A unidade ${data.name} foi atualizada com sucesso.`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar unidade",
        description: error.message || "Erro ao atualizar a unidade.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (unitId: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] })
      toast({
        title: "Unidade removida!",
        description: "A unidade foi removida com sucesso.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover unidade",
        description: error.message || "Erro ao remover a unidade.",
        variant: "destructive",
      })
    },
  })
}

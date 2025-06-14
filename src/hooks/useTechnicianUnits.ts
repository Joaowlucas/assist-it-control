
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface TechnicianUnit {
  id: string
  technician_id: string
  unit_id: string
  unit?: {
    name: string
  }
}

export function useTechnicianUnits(technicianId?: string) {
  return useQuery({
    queryKey: ['technician-units', technicianId],
    queryFn: async () => {
      if (!technicianId) return []
      
      const { data, error } = await supabase
        .from('technician_units')
        .select(`
          *,
          unit:units(name)
        `)
        .eq('technician_id', technicianId)

      if (error) throw error
      return data as TechnicianUnit[]
    },
    enabled: !!technicianId,
  })
}

export function useCreateTechnicianUnits() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ technicianId, unitIds }: { technicianId: string, unitIds: string[] }) => {
      const technicianUnits = unitIds.map(unitId => ({
        technician_id: technicianId,
        unit_id: unitId
      }))

      const { data, error } = await supabase
        .from('technician_units')
        .insert(technicianUnits)

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-units'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atribuir unidades',
        description: error.message || 'Erro ao atribuir unidades ao técnico.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTechnicianUnits() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ technicianId, unitIds }: { technicianId: string, unitIds: string[] }) => {
      // Delete existing units
      await supabase
        .from('technician_units')
        .delete()
        .eq('technician_id', technicianId)

      // Insert new units
      if (unitIds.length > 0) {
        const technicianUnits = unitIds.map(unitId => ({
          technician_id: technicianId,
          unit_id: unitId
        }))

        const { data, error } = await supabase
          .from('technician_units')
          .insert(technicianUnits)

        if (error) throw error
        return data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-units'] })
      toast({
        title: 'Unidades atualizadas!',
        description: 'As unidades do técnico foram atualizadas com sucesso.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar unidades',
        description: error.message || 'Erro ao atualizar unidades do técnico.',
        variant: 'destructive',
      })
    },
  })
}


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
      
      console.log('Fetching technician units for:', technicianId)
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true, // Refetch quando voltar ao foco
    refetchOnReconnect: true,
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
    onSuccess: (_, variables) => {
      // Invalidar dados relacionados às unidades do técnico
      queryClient.invalidateQueries({ queryKey: ['technician-units'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] })
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
    onSuccess: (_, variables) => {
      // Invalidar todas as queries que dependem das unidades do técnico
      queryClient.invalidateQueries({ queryKey: ['technician-units', variables.technicianId] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['admin-equipment-requests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-charts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] })
      
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

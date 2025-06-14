
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

type Equipment = Tables<'equipment'> & {
  unit?: { name: string } | null
}
type EquipmentInsert = TablesInsert<'equipment'>
type EquipmentUpdate = TablesUpdate<'equipment'>

export function useEquipment() {
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)

  return useQuery({
    queryKey: ['equipment', profile?.id, profile?.role, technicianUnits],
    queryFn: async () => {
      console.log('Fetching equipment data...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []

      let query = supabase
        .from('equipment')
        .select(`
          *,
          unit:units(name)
        `)

      // Apply unit filter for technicians
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        query = query.in('unit_id', allowedUnitIds)
      }

      const { data, error } = await query.order('tombamento', { ascending: true })
      
      if (error) throw error
      return data as Equipment[]
    },
    enabled: !!profile, // Only run when profile is loaded
  })
}

export function useEquipmentById(id: string) {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select(`
          *,
          unit:units(name)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as Equipment
    },
    enabled: !!id,
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
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
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
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
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

export function useDeleteEquipment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Equipamento removido com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover equipamento: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

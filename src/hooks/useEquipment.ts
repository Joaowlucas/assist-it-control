
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'
import { EquipmentFilters } from './useEquipmentFilters'

type Equipment = Tables<'equipment'> & {
  unit?: { name: string } | null
}
type EquipmentInsert = TablesInsert<'equipment'>
type EquipmentUpdate = TablesUpdate<'equipment'>

export function useEquipment(filters?: EquipmentFilters) {
  return useQuery({
    queryKey: ['equipment', filters],
    queryFn: async () => {
      let query = supabase
        .from('equipment')
        .select(`
          *,
          unit:units(name)
        `)

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      
      if (filters?.unitId) {
        query = query.eq('unit_id', filters.unitId)
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,brand.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%,tombamento.ilike.%${filters.searchTerm}%`)
      }

      // If filtering by assigned user, we need a different approach
      if (filters?.assignedUserId) {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('equipment_id')
          .eq('user_id', filters.assignedUserId)
          .eq('status', 'ativo')

        if (assignments && assignments.length > 0) {
          const equipmentIds = assignments.map(a => a.equipment_id)
          query = query.in('id', equipmentIds)
        } else {
          // If no assignments found, return empty array
          return []
        }
      }

      query = query.order('tombamento', { ascending: true })
      
      const { data, error } = await query
      
      if (error) throw error
      return data as Equipment[]
    },
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
      console.log('Creating equipment with data:', equipment)
      
      const { data, error } = await supabase
        .from('equipment')
        .insert(equipment)
        .select()
        .single()
      
      if (error) {
        console.error('Error creating equipment:', error)
        throw error
      }
      
      console.log('Equipment created successfully:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment-stats'] })
      toast({
        title: 'Sucesso',
        description: 'Equipamento criado com sucesso',
      })
    },
    onError: (error) => {
      console.error('Equipment creation failed:', error)
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

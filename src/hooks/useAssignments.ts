
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'

type Assignment = Tables<'assignments'>
type AssignmentInsert = TablesInsert<'assignments'>
type AssignmentUpdate = TablesUpdate<'assignments'>

export function useAssignments() {
  const { profile } = useAuth()
  const { data: technicianUnits } = useTechnicianUnits(profile?.role === 'technician' ? profile.id : undefined)

  return useQuery({
    queryKey: ['assignments', profile?.id, profile?.role, technicianUnits],
    queryFn: async () => {
      console.log('Fetching assignments data...')
      
      // Get unit filter for technicians
      const shouldFilterByUnits = profile?.role === 'technician' && technicianUnits
      const allowedUnitIds = shouldFilterByUnits ? technicianUnits.map(tu => tu.unit_id) : []

      let query = supabase
        .from('assignments')
        .select(`
          *,
          equipment:equipment(name, type, brand, model, unit_id),
          user:profiles!assignments_user_id_fkey(name, email),
          assigned_by_user:profiles!assignments_assigned_by_fkey(name, email)
        `)

      // Apply unit filter for technicians - filter by equipment unit
      if (shouldFilterByUnits && allowedUnitIds.length > 0) {
        // We need to filter assignments where the equipment belongs to the technician's units
        // This requires a subquery approach since we're joining with equipment
        const { data: allowedEquipmentIds } = await supabase
          .from('equipment')
          .select('id')
          .in('unit_id', allowedUnitIds)
        
        if (allowedEquipmentIds && allowedEquipmentIds.length > 0) {
          const equipmentIds = allowedEquipmentIds.map(eq => eq.id)
          query = query.in('equipment_id', equipmentIds)
        } else {
          // If no equipment found, return empty result
          return []
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!profile, // Only run when profile is loaded
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (assignment: Omit<AssignmentInsert, 'assigned_by'>) => {
      if (!profile?.id) throw new Error('User not authenticated')
      
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          ...assignment,
          assigned_by: profile.id
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Atribuição criada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar atribuição: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: AssignmentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Atribuição atualizada com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar atribuição: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      toast({
        title: 'Sucesso',
        description: 'Atribuição excluída com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir atribuição: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useEndAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('assignments')
        .update({
          status: 'finalizado',
          end_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', assignmentId)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      
      toast({
        title: 'Sucesso',
        description: 'Atribuição finalizada com sucesso. O equipamento agora está disponível para nova atribuição.',
      })
    },
    onError: (error: any) => {
      console.error('Erro ao finalizar atribuição:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao finalizar atribuição: ' + (error?.message || 'Erro desconhecido'),
        variant: 'destructive',
      })
    },
  })
}

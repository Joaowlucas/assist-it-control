
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
      
      let query = supabase
        .from('assignments')
        .select(`
          id,
          user_id,
          equipment_id,
          assigned_by,
          start_date,
          end_date,
          status,
          notes,
          created_at,
          updated_at,
          equipment!inner(
            id,
            name,
            type,
            brand,
            model,
            tombamento,
            unit_id,
            unit:units(id, name)
          ),
          user:profiles!assignments_user_id_fkey(
            id,
            name,
            email,
            unit_id,
            unit:units(id, name)
          ),
          assigned_by_user:profiles!assignments_assigned_by_fkey(
            id,
            name, 
            email
          )
        `)

      // Apply unit filter for technicians - filter by equipment unit
      if (profile?.role === 'technician' && technicianUnits && technicianUnits.length > 0) {
        const allowedUnitIds = technicianUnits.map(tu => tu.unit_id)
        console.log('Filtering assignments by technician units:', allowedUnitIds)
        query = query.in('equipment.unit_id', allowedUnitIds)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching assignments:', error)
        throw error
      }

      console.log('Assignments data loaded:', data?.length || 0, 'records')
      console.log('Sample assignment data:', data?.[0])
      return data || []
    },
    enabled: !!profile, // Only run when profile is loaded
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (assignment: AssignmentInsert) => {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignment)
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

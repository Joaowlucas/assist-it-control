
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { TablesInsert } from '@/integrations/supabase/types'
import { useToast } from '@/hooks/use-toast'

type AssignmentInsert = TablesInsert<'assignments'>

export function useCreateAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (assignment: AssignmentInsert) => {
      // Verificar se o equipamento está realmente disponível antes de criar a atribuição
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, name, status')
        .eq('id', assignment.equipment_id)
        .eq('status', 'disponivel')
        .single()

      if (equipmentError || !equipment) {
        throw new Error('Equipamento não encontrado ou não está disponível para atribuição')
      }

      // Verificar se não há atribuições ativas para este equipamento
      const { data: existingAssignments, error: assignmentError } = await supabase
        .from('assignments')
        .select('id')
        .eq('equipment_id', assignment.equipment_id)
        .eq('status', 'ativo')

      if (assignmentError) {
        throw new Error('Erro ao verificar atribuições existentes')
      }

      if (existingAssignments && existingAssignments.length > 0) {
        throw new Error('Este equipamento já possui uma atribuição ativa')
      }

      // Criar a atribuição (o trigger do banco automaticamente atualizará o status do equipamento)
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignment)
        .select()
        .single()
      
      if (error) {
        // Tratar erros específicos
        if (error.code === '23505' && error.message.includes('idx_unique_active_assignment_per_equipment')) {
          throw new Error('Este equipamento já possui uma atribuição ativa')
        }
        throw error
      }
      
      return data
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['available-equipment'] })
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
      
      toast({
        title: 'Sucesso',
        description: 'Atribuição criada com sucesso. O equipamento foi marcado como em uso.',
      })
    },
    onError: (error: any) => {
      console.error('Erro ao criar atribuição:', error)
      toast({
        title: 'Erro',
        description: error.message || 'Erro desconhecido ao criar atribuição',
        variant: 'destructive',
      })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface KanbanColumn {
  id: string
  board_id: string
  name: string
  color: string
  position: number
  created_at: string
  updated_at: string
}

export interface CreateColumnData {
  board_id: string
  name: string
  color?: string
}

export function useKanbanColumns(boardId: string) {
  return useQuery({
    queryKey: ['kanban-columns', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as KanbanColumn[]
    },
    enabled: !!boardId,
  })
}

export function useCreateColumn() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (columnData: CreateColumnData) => {
      // Get the next position for the column
      const { data: lastColumn } = await supabase
        .from('kanban_columns')
        .select('position')
        .eq('board_id', columnData.board_id)
        .order('position', { ascending: false })
        .limit(1)

      const position = lastColumn && lastColumn.length > 0 ? lastColumn[0].position + 1 : 0

      const { data, error } = await supabase
        .from('kanban_columns')
        .insert([{ 
          ...columnData, 
          color: columnData.color || 'bg-slate-100',
          position 
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', data.board_id] })
      toast({
        title: 'Sucesso',
        description: 'Coluna criada com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar coluna: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateColumn() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, board_id, ...updates }: { id: string; board_id: string } & Partial<CreateColumnData>) => {
      const { data, error } = await supabase
        .from('kanban_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', data.board_id] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar coluna: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteColumn() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, board_id }: { id: string; board_id: string }) => {
      const { error } = await supabase
        .from('kanban_columns')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { board_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', data.board_id] })
      toast({
        title: 'Sucesso',
        description: 'Coluna excluída com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir coluna: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/useAuth'

export interface KanbanBoard {
  id: string
  name: string
  description?: string
  created_by: string
  unit_id?: string
  is_unit_wide: boolean
  created_at: string
  updated_at: string
}

export interface CreateBoardData {
  name: string
  description?: string
  unit_id?: string
  is_unit_wide: boolean
}

export function useKanbanBoards() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['kanban-boards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_boards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as KanbanBoard[]
    },
    enabled: !!profile?.id,
  })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (boardData: CreateBoardData) => {
      const { data, error } = await supabase
        .from('kanban_boards')
        .insert([{ ...boardData, created_by: (await supabase.auth.getUser()).data.user?.id! }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] })
      toast({
        title: 'Sucesso',
        description: 'Quadro criado com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar quadro: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateBoard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateBoardData>) => {
      const { data, error } = await supabase
        .from('kanban_boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] })
      toast({
        title: 'Sucesso',
        description: 'Quadro atualizado com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar quadro: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteBoard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from('kanban_boards')
        .delete()
        .eq('id', boardId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-boards'] })
      toast({
        title: 'Sucesso',
        description: 'Quadro excluído com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir quadro: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
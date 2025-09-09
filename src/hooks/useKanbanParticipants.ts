import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface KanbanParticipant {
  id: string
  board_id: string
  user_id: string
  role: 'member' | 'editor' | 'admin'
  added_by: string
  added_at: string
  profiles: {
    name: string
    email: string
    avatar_url?: string
  }
}

export function useBoardParticipants(boardId: string) {
  return useQuery({
    queryKey: ['board-participants', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_board_participants')
        .select(`
          *,
          profiles(name, email, avatar_url)
        `)
        .eq('board_id', boardId)
        .order('added_at', { ascending: true })

      if (error) throw error
      return (data as any[])?.map(item => ({
        ...item,
        profiles: item.profiles || { name: 'Usuário', email: '', avatar_url: null }
      })) as KanbanParticipant[]
    },
    enabled: !!boardId,
  })
}

export function useAddParticipant() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ board_id, user_id, role = 'member' }: { 
      board_id: string
      user_id: string
      role?: 'member' | 'editor' | 'admin'
    }) => {
      const { data, error } = await supabase
        .from('kanban_board_participants')
        .insert([{ 
          board_id, 
          user_id, 
          role, 
          added_by: (await supabase.auth.getUser()).data.user?.id! 
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-participants', data.board_id] })
      toast({
        title: 'Sucesso',
        description: 'Participante adicionado com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar participante: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, board_id }: { id: string; board_id: string }) => {
      const { error } = await supabase
        .from('kanban_board_participants')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { board_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-participants', data.board_id] })
      toast({
        title: 'Sucesso',
        description: 'Participante removido com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover participante: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateParticipantRole() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, board_id, role }: { 
      id: string
      board_id: string
      role: 'member' | 'editor' | 'admin'
    }) => {
      const { data, error } = await supabase
        .from('kanban_board_participants')
        .update({ role })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { ...data, board_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['board-participants', data.board_id] })
      toast({
        title: 'Sucesso',
        description: 'Papel do participante atualizado com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar papel: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
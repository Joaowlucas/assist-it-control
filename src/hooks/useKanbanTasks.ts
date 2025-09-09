import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface KanbanTask {
  id: string
  board_id: string
  title: string
  description?: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  created_by: string
  due_date?: string
  position: number
  labels: string[]
  created_at: string
  updated_at: string
  task_type: 'custom' | 'equipment' | 'ticket'
  equipment_id?: string
  ticket_id?: string
  profiles?: {
    name: string
    avatar_url?: string
  }
  equipment?: {
    id: string
    name: string
    type: string
    tombamento?: string
    status: string
  }
  ticket?: {
    id: string
    title: string
    ticket_number: number
    status: string
    priority: string
  }
}

export interface CreateTaskData {
  board_id: string
  title: string
  description?: string
  status?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  due_date?: string
  labels?: string[]
  task_type?: 'custom' | 'equipment' | 'ticket'
  equipment_id?: string
  ticket_id?: string
}

export function useKanbanTasks(boardId: string) {
  return useQuery({
    queryKey: ['kanban-tasks', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kanban_tasks')
        .select(`
          *,
          profiles(name, avatar_url),
          equipment(id, name, type, tombamento, status),
          tickets(id, title, ticket_number, status, priority)
        `)
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching kanban tasks:', error)
        throw error
      }
      
      console.log('Fetched tasks for board:', boardId, data)
      
      return (data as any[])?.map(item => ({
        ...item,
        profiles: item.profiles || { name: 'Usuário', avatar_url: null },
        equipment: item.equipment || null,
        ticket: item.tickets || null
      })) as KanbanTask[]
    },
    enabled: !!boardId,
    // Adicionar opções para garantir que os dados sejam sempre atualizados
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      // Get the next position for the task
      const { data: lastTask } = await supabase
        .from('kanban_tasks')
        .select('position')
        .eq('board_id', taskData.board_id)
        .eq('status', taskData.status || 'A Fazer')
        .order('position', { ascending: false })
        .limit(1)

      const position = lastTask && lastTask.length > 0 ? lastTask[0].position + 1 : 0

      const { data, error } = await supabase
        .from('kanban_tasks')
        .insert([{ 
          ...taskData, 
          created_by: (await supabase.auth.getUser()).data.user?.id!,
          position 
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidar múltiplas queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks', data.board_id] })
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['kanban-columns', data.board_id] })
      
      // Forçar refetch imediatamente
      queryClient.refetchQueries({ queryKey: ['kanban-tasks', data.board_id] })
      
      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar tarefa: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, board_id, ...updates }: { id: string; board_id: string } & Partial<CreateTaskData>) => {
      const { data, error } = await supabase
        .from('kanban_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks', data.board_id] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar tarefa: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, board_id }: { id: string; board_id: string }) => {
      const { error } = await supabase
        .from('kanban_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { board_id }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tasks', data.board_id] })
      toast({
        title: 'Sucesso',
        description: 'Tarefa excluída com sucesso',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir tarefa: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}
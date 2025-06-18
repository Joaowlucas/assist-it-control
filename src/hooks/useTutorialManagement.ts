
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface CreateTutorialData {
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  category?: string
  is_published?: boolean
}

export interface UpdateTutorialData extends CreateTutorialData {
  id: string
}

export function useAllTutorials() {
  return useQuery({
    queryKey: ['tutorials', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles!author_id(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })
}

export function useCreateTutorial() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTutorialData) => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Usuário não autenticado')

      const { data: tutorial, error } = await supabase
        .from('tutorials')
        .insert({
          ...data,
          author_id: user.user.id,
        })
        .select()
        .single()

      if (error) throw error
      return tutorial
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
      toast({
        title: "Sucesso",
        description: "Tutorial criado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao criar tutorial:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o tutorial",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateTutorial() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateTutorialData) => {
      const { data: tutorial, error } = await supabase
        .from('tutorials')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return tutorial
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
      toast({
        title: "Sucesso",
        description: "Tutorial atualizado com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao atualizar tutorial:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tutorial",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteTutorial() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
      toast({
        title: "Sucesso",
        description: "Tutorial removido com sucesso",
      })
    },
    onError: (error) => {
      console.error('Erro ao deletar tutorial:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o tutorial",
        variant: "destructive",
      })
    },
  })
}

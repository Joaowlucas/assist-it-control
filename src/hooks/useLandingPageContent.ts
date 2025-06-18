
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types'

type LandingPageContent = Tables<'landing_page_content'>
type LandingPageContentInsert = TablesInsert<'landing_page_content'>
type LandingPageContentUpdate = TablesUpdate<'landing_page_content'>

export function useLandingPageContent() {
  return useQuery({
    queryKey: ['landing-page-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })
}

export function useCreateLandingPageContent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (content: LandingPageContentInsert) => {
      const { data, error } = await supabase
        .from('landing_page_content')
        .insert(content)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-content'] })
      toast({
        title: 'Sucesso',
        description: 'Comunicado criado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar comunicado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateLandingPageContent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: LandingPageContentUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('landing_page_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-content'] })
      toast({
        title: 'Sucesso',
        description: 'Comunicado atualizado com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar comunicado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteLandingPageContent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_page_content')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-content'] })
      toast({
        title: 'Sucesso',
        description: 'Comunicado excluído com sucesso',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir comunicado: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

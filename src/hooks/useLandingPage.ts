
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useLandingPageContent() {
  return useQuery({
    queryKey: ['landing-page-content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_content')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      
      if (error) throw error
      return data
    },
  })
}

export function useCreateLandingPageContent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (content: {
      type: 'image' | 'announcement';
      title?: string;
      content?: string;
      image_url?: string;
      display_order: number;
    }) => {
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
        title: 'Conteúdo adicionado!',
        description: 'O conteúdo foi adicionado à landing page.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar conteúdo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateLandingPageContent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
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
        title: 'Conteúdo atualizado!',
        description: 'O conteúdo foi atualizado com sucesso.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar conteúdo',
        description: error.message,
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
        title: 'Conteúdo removido!',
        description: 'O conteúdo foi removido da landing page.',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover conteúdo',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

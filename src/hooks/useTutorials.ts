
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export interface Tutorial {
  id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  author_id: string
  category: string
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
  author?: {
    name: string
    email: string
  }
}

export function useTutorials() {
  return useQuery({
    queryKey: ['tutorials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles!author_id(name, email)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Tutorial[]
    },
  })
}

export function useIncrementTutorialViews() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tutorialId: string) => {
      const { error } = await supabase.rpc('increment_tutorial_views', {
        tutorial_id: tutorialId
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorials'] })
    },
    onError: (error) => {
      console.error('Erro ao incrementar visualizações:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a visualização",
        variant: "destructive",
      })
    },
  })
}

export function useTutorialsByCategory(category?: string) {
  return useQuery({
    queryKey: ['tutorials', 'category', category],
    queryFn: async () => {
      let query = supabase
        .from('tutorials')
        .select(`
          *,
          author:profiles!author_id(name, email)
        `)
        .eq('is_published', true)

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Tutorial[]
    },
    enabled: !!category,
  })
}

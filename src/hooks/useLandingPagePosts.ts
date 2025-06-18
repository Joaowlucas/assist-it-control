
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useLandingPagePosts() {
  return useQuery({
    queryKey: ['landing-page-posts'],
    queryFn: async () => {
      console.log('Fetching landing page posts')
      
      const { data, error } = await supabase
        .from('landing_page_posts')
        .select(`
          *,
          profiles:author_id (
            name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching posts:', error)
        throw error
      }
      
      console.log('Posts fetched:', data)
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  })
}

export function useCreateLandingPagePost() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (post: any) => {
      console.log('Creating landing page post:', post)
      
      const { data, error } = await supabase
        .from('landing_page_posts')
        .insert({
          ...post,
          author_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single()
      
      if (error) {
        console.error('Error creating post:', error)
        throw error
      }
      
      console.log('Post created:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-posts'] })
      toast({
        title: 'Post criado com sucesso!',
        description: 'O post foi publicado na landing page.',
      })
    },
    onError: (error: any) => {
      console.error('Create post error:', error)
      toast({
        title: 'Erro ao criar post',
        description: error.message || 'Erro ao publicar o post.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateLandingPagePost() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...post }: any) => {
      console.log('Updating landing page post:', { id, post })
      
      const { data, error } = await supabase
        .from('landing_page_posts')
        .update(post)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Error updating post:', error)
        throw error
      }
      
      console.log('Post updated:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-posts'] })
      toast({
        title: 'Post atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      })
    },
    onError: (error: any) => {
      console.error('Update post error:', error)
      toast({
        title: 'Erro ao atualizar post',
        description: error.message || 'Erro ao salvar as alterações.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteLandingPagePost() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (postId: string) => {
      console.log('Deleting landing page post:', postId)
      
      const { error } = await supabase
        .from('landing_page_posts')
        .delete()
        .eq('id', postId)
      
      if (error) {
        console.error('Error deleting post:', error)
        throw error
      }
      
      console.log('Post deleted successfully')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-posts'] })
      toast({
        title: 'Post excluído!',
        description: 'O post foi removido da landing page.',
      })
    },
    onError: (error: any) => {
      console.error('Delete post error:', error)
      toast({
        title: 'Erro ao excluir post',
        description: error.message || 'Erro ao remover o post.',
        variant: 'destructive',
      })
    },
  })
}

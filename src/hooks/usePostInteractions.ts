
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles: {
    name: string
    avatar_url?: string
  }
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles(name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as PostComment[]
    },
    enabled: !!postId,
  })
}

export function usePostLikes(postId: string) {
  return useQuery({
    queryKey: ['post-likes', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)

      if (error) throw error
      return data as PostLike[]
    },
    enabled: !!postId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (data: { postId: string; content: string }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { data: result, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: data.postId,
          user_id: profile.id,
          content: data.content,
        }])
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] })
    },
  })
}

export function useToggleLike() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!profile?.id) throw new Error('User not authenticated')

      // Verificar se já curtiu
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', profile.id)
        .single()

      if (existingLike) {
        // Descurtir
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('id', existingLike.id)
        
        if (error) throw error
        return { action: 'unliked' }
      } else {
        // Curtir
        const { data: result, error } = await supabase
          .from('post_likes')
          .insert([{
            post_id: postId,
            user_id: profile.id,
          }])
          .select()
          .single()

        if (error) throw error
        return { action: 'liked', data: result }
      }
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ['post-likes', postId] })
    },
  })
}

export function useVotePoll() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (data: { postId: string; optionIndex: number }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      // Buscar post atual
      const { data: post, error: fetchError } = await supabase
        .from('landing_page_posts')
        .select('poll_votes')
        .eq('id', data.postId)
        .single()

      if (fetchError) throw fetchError

      const currentVotes = post.poll_votes || {}
      const optionKey = data.optionIndex.toString()
      
      // Verificar se usuário já votou
      const hasVoted = Object.values(currentVotes).some((voters: any) => 
        Array.isArray(voters) && voters.includes(profile.id)
      )

      if (hasVoted) {
        throw new Error('Você já votou nesta enquete')
      }

      // Adicionar voto
      if (!currentVotes[optionKey]) {
        currentVotes[optionKey] = []
      }
      currentVotes[optionKey].push(profile.id)

      const { error } = await supabase
        .from('landing_page_posts')
        .update({ poll_votes: currentVotes })
        .eq('id', data.postId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

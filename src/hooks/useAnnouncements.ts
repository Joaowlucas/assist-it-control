
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'text' | 'poll' | 'image'
  author_id: string
  created_at: string
  updated_at: string
  is_featured: boolean
  is_published: boolean
  view_count: number
  media_url?: string
  poll_options?: string[]
  poll_votes?: Record<string, string[]>
  profiles: {
    name: string
    avatar_url?: string
  }
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_posts')
        .select(`
          *,
          profiles(name, avatar_url)
        `)
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Announcement[]
    },
  })
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (data: {
      title: string
      content: string
      type: 'text' | 'poll' | 'image'
      media_url?: string
      poll_options?: string[]
      is_featured?: boolean
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      const { data: result, error } = await supabase
        .from('landing_page_posts')
        .insert([{
          title: data.title,
          content: data.content,
          type: data.type,
          author_id: profile.id,
          media_url: data.media_url,
          poll_options: data.poll_options || [],
          is_featured: data.is_featured || false,
          is_published: true,
        }])
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      id: string
      title?: string
      content?: string
      is_featured?: boolean
      is_published?: boolean
    }) => {
      const { data: result, error } = await supabase
        .from('landing_page_posts')
        .update(data)
        .eq('id', data.id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_page_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

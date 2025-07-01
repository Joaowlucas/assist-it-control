
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { useTechnicianUnits } from '@/hooks/useTechnicianUnits'
import { useEffect } from 'react'

export interface AnnouncementWithUnits {
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
  unit_ids: string[]
  status: 'published' | 'pending_approval' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  profiles: {
    name: string
    avatar_url?: string
  }
}

export function useAnnouncementsWithUnits() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['announcements-with-units', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_posts')
        .select(`
          *,
          profiles(name, avatar_url)
        `)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AnnouncementWithUnits[]
    },
    enabled: !!profile,
  })

  // Setup realtime subscription
  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'landing_page_posts'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['announcements-with-units'] })
          queryClient.invalidateQueries({ queryKey: ['pending-announcements'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, queryClient])

  return query
}

export function usePendingAnnouncements() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['pending-announcements', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_posts')
        .select(`
          *,
          profiles(name, avatar_url)
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as AnnouncementWithUnits[]
    },
    enabled: !!profile && (profile.role === 'admin' || profile.role === 'technician'),
  })
}

export function useCreateAnnouncementWithUnits() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      title: string
      content: string
      type: 'text' | 'poll' | 'image'
      media_url?: string
      poll_options?: string[]
      is_featured?: boolean
      unit_ids: string[]
    }) => {
      if (!profile?.id) throw new Error('User not authenticated')

      // Determinar status baseado no role
      let status = 'pending_approval'
      if (profile.role === 'admin') {
        status = 'published'
      } else if (profile.role === 'technician') {
        status = 'published'
      }

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
          unit_ids: data.unit_ids,
          status: status,
          is_published: status === 'published',
        }])
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements-with-units'] })
      queryClient.invalidateQueries({ queryKey: ['pending-announcements'] })
      
      const statusMessage = profile?.role === 'user' 
        ? 'Comunicado enviado para aprovação!' 
        : 'Comunicado publicado com sucesso!'
      
      toast({
        title: 'Sucesso',
        description: statusMessage,
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

export function useApproveAnnouncement() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: { id: string; approved: boolean; reason?: string }) => {
      const updateData: any = {
        status: data.approved ? 'published' : 'rejected',
        is_published: data.approved,
        approved_by: data.approved ? (await supabase.auth.getUser()).data.user?.id : null,
        approved_at: data.approved ? new Date().toISOString() : null,
      }

      if (!data.approved && data.reason) {
        updateData.rejection_reason = data.reason
      }

      const { error } = await supabase
        .from('landing_page_posts')
        .update(updateData)
        .eq('id', data.id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['announcements-with-units'] })
      queryClient.invalidateQueries({ queryKey: ['pending-announcements'] })
      
      toast({
        title: 'Sucesso',
        description: variables.approved ? 'Comunicado aprovado!' : 'Comunicado rejeitado!',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao processar aprovação: ' + error.message,
        variant: 'destructive',
      })
    },
  })
}

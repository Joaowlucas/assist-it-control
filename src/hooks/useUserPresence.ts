
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

interface PresenceUser {
  id: string
  name: string
  avatar_url?: string
  status: 'online' | 'offline' | 'away'
  last_seen: string
  is_typing_in?: string
}

export function useUserPresence() {
  const { profile } = useAuth()
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])

  // Initialize presence for current user
  useEffect(() => {
    if (!profile?.id) return

    const initPresence = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: profile.id,
          status: 'online',
          last_seen: new Date().toISOString()
        })
    }

    initPresence()

    // Update presence every 30 seconds
    const interval = setInterval(async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: profile.id,
          status: 'online',
          last_seen: new Date().toISOString()
        })
    }, 30000)

    // Set offline on beforeunload
    const handleBeforeUnload = async () => {
      await supabase
        .from('user_presence')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString(),
          is_typing_in: null
        })
        .eq('user_id', profile.id)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleBeforeUnload()
    }
  }, [profile?.id])

  // Subscribe to presence changes with unique channel name
  useEffect(() => {
    if (!profile?.unit_id) return

    const channelName = `user-presence-${profile.unit_id}-${Date.now()}`
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_presence' },
        async () => {
          console.log('Presence changed, fetching updated data...')
          // Fetch updated presence data
          const { data } = await supabase
            .from('user_presence')
            .select(`
              *,
              profiles (
                id,
                name,
                avatar_url,
                unit_id
              )
            `)
            .eq('profiles.unit_id', profile.unit_id)

          if (data) {
            setPresenceUsers(data.map((p: any) => ({
              id: p.profiles.id,
              name: p.profiles.name,
              avatar_url: p.profiles.avatar_url,
              status: p.status,
              last_seen: p.last_seen,
              is_typing_in: p.is_typing_in
            })))
          }
        }
      )
      .subscribe()

    return () => {
      console.log('Cleaning up presence channel:', channelName)
      supabase.removeChannel(channel)
    }
  }, [profile?.unit_id])

  const updateTypingStatus = useCallback(async (conversationId: string | null, isTyping: boolean) => {
    if (!profile?.id) return

    await supabase
      .from('user_presence')
      .update({
        is_typing_in: isTyping ? conversationId : null
      })
      .eq('user_id', profile.id)
  }, [profile?.id])

  const getTypingUsers = useCallback((conversationId: string) => {
    return presenceUsers.filter(user => user.is_typing_in === conversationId)
  }, [presenceUsers])

  const getUserStatus = useCallback((userId: string) => {
    const user = presenceUsers.find(u => u.id === userId)
    return user?.status || 'offline'
  }, [presenceUsers])

  return {
    presenceUsers,
    updateTypingStatus,
    getTypingUsers,
    getUserStatus
  }
}

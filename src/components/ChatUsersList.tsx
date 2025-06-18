
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Users, Dot } from 'lucide-react'
import { useAvailableUsers } from '@/hooks/useAvailableUsers'
import { useChatParticipants } from '@/hooks/useChat'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface ChatUsersListProps {
  roomId: string | null
  onStartDirectChat?: (userId: string) => void
}

interface UserPresence {
  user: string
  online_at: string
}

export function ChatUsersList({ roomId, onStartDirectChat }: ChatUsersListProps) {
  const { profile } = useAuth()
  const { data: allUsers } = useAvailableUsers()
  const { data: participants } = useChatParticipants(roomId || '')
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!roomId) return

    const channel = supabase.channel(`presence-${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = Object.keys(state).flatMap(key => 
          state[key].map((presence: UserPresence) => presence.user)
        )
        setOnlineUsers(userIds)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const userIds = newPresences.map((presence: UserPresence) => presence.user)
        setOnlineUsers(prev => [...new Set([...prev, ...userIds])])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const userIds = leftPresences.map((presence: UserPresence) => presence.user)
        setOnlineUsers(prev => prev.filter(id => !userIds.includes(id)))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && profile) {
          await channel.track({
            user: profile.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, profile])

  const roomParticipants = participants?.map(p => ({
    id: p.user_id,
    name: p.profiles?.name || 'Usuário',
    avatar_url: p.profiles?.avatar_url,
    isOnline: onlineUsers.includes(p.user_id)
  })) || []

  const otherUsers = allUsers?.filter(user => 
    user.id !== profile?.id &&
    !roomParticipants.some(p => p.id === user.id)
  ).map(user => ({
    id: user.id,
    name: user.name,
    avatar_url: null,
    isOnline: onlineUsers.includes(user.id),
    role: user.role
  })) || []

  return (
    <div className="w-80 border-l bg-muted/30">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuários
        </h3>
      </div>

      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Participantes da sala atual */}
          {roomId && roomParticipants.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Nesta conversa ({roomParticipants.length})
              </h4>
              <div className="space-y-2">
                {roomParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => onStartDirectChat?.(participant.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.avatar_url || undefined} />
                        <AvatarFallback>
                          {participant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {participant.isOnline && (
                        <Dot className="absolute -top-1 -right-1 h-4 w-4 text-green-500 fill-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {participant.name}
                        {participant.id === profile?.id && ' (você)'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant={participant.isOnline ? 'default' : 'secondary'} className="text-xs">
                          {participant.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                    {participant.id !== profile?.id && (
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outros usuários do sistema */}
          {otherUsers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Outros usuários ({otherUsers.length})
              </h4>
              <div className="space-y-2">
                {otherUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => onStartDirectChat?.(user.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <Dot className="absolute -top-1 -right-1 h-4 w-4 text-green-500 fill-current" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.isOnline ? 'default' : 'secondary'} className="text-xs">
                          {user.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.role === 'admin' ? 'Admin' : user.role === 'technician' ? 'Técnico' : 'Usuário'}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {roomParticipants.length === 0 && otherUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}


import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, Users } from 'lucide-react'
import { useUnitUsers } from '@/hooks/useConversations'
import { NewChatModal } from '@/components/NewChatModal'
import { supabase } from '@/integrations/supabase/client'

interface ChatUsersListProps {
  onDirectChat?: (roomId: string) => void
}

export function ChatUsersList({ onDirectChat }: ChatUsersListProps) {
  const { data: availableUsers = [] } = useUnitUsers()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    const channel = supabase.channel('online-users')
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = Object.keys(state).map(key => {
          const presences = state[key] as Array<{ user_id?: string }>
          return presences[0]?.user_id
        }).filter(Boolean) as string[]
        setOnlineUsers(userIds)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const userIds = (newPresences as Array<{ user_id?: string }>)
          .map((presence) => presence.user_id)
          .filter(Boolean) as string[]
        setOnlineUsers(prev => [...new Set([...prev, ...userIds])])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const userIds = (leftPresences as Array<{ user_id?: string }>)
          .map((presence) => presence.user_id)
          .filter(Boolean) as string[]
        setOnlineUsers(prev => prev.filter(id => !userIds.includes(id)))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleRoomCreated = (roomId: string) => {
    onDirectChat?.(roomId)
  }

  const onlineProfiles = availableUsers.filter(profile => 
    onlineUsers.includes(profile.id)
  )

  const offlineProfiles = availableUsers.filter(profile => 
    !onlineUsers.includes(profile.id)
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuários
        </CardTitle>
        <CardDescription>
          {onlineProfiles.length} usuários online
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-4">
            {onlineProfiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online ({onlineProfiles.length})
                </h4>
                <div className="space-y-2">
                  {onlineProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30 group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted dark:bg-muted/50">
                              {profile.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {profile.role === 'admin' ? 'Administrador' : 
                             profile.role === 'technician' ? 'Técnico' : 'Usuário'}
                          </p>
                        </div>
                      </div>
                      <NewChatModal />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {offlineProfiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  Offline ({offlineProfiles.length})
                </h4>
                <div className="space-y-2">
                  {offlineProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/30 group">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8 opacity-60">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-muted dark:bg-muted/50">
                              {profile.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 border-2 border-background rounded-full" />
                        </div>
                        <div>
                          <p className="text-sm font-medium opacity-60">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {profile.role === 'admin' ? 'Administrador' : 
                             profile.role === 'technician' ? 'Técnico' : 'Usuário'}
                          </p>
                        </div>
                      </div>
                      <NewChatModal />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
